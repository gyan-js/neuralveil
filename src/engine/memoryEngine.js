import { GPU_VRAM } from './precisionBytes.js'

export function calcLayerParams(layer) {
  const { type, units = 0, output = units, extra = 0 } = layer

  switch (type) {
    case 'Dense':
      // (inpt_features × otpt_features) + otpt_features (bias)
      return units * output + output

    case 'Conv2D': {
      // (kernel_h × kernel_w × in_channels × out_channels) + out_channels (bias)
      // Default 3×3 kernel
      const kernelH = layer.kernelH || 3
      const kernelW = layer.kernelW || 3
      return kernelH * kernelW * units * output + output
    }

    case 'Embedding':
      // vocab_size × embedding_dim
      return units * output

    case 'MultiHeadAttention':
      // 4 × embed_dim² (Q, K, V, O projections — each is embed_dim × embed_dim)
      return 4 * units * units

    case 'LSTM': {
      // 4 × (hidden² + input×hidden + hidden) per layer (4 gates)
      const inputDim = extra || units
      return 4 * (units * units + inputDim * units + units)
    }

    case 'BatchNorm':
    case 'LayerNorm':
      // 2 × num_features (gamma + beta)
      return 2 * units

    case 'Dropout':
    case 'Activation':
      // No learnable parameters
      return 0

    default:
      return 0
  }
}

export function calcWeights(layers, precisionBytes) {
  const perLayer = layers.map((layer) => {
    const params = calcLayerParams(layer)
    const memGB = (params * precisionBytes) / 1e9
    return { layerId: layer.id, params, memGB }
  })

  const total = perLayer.reduce((sum, l) => sum + l.memGB, 0)
  return { total, perLayer }
}



export function calcGradientCheckpointingFactor(numLayers) {
  if (numLayers <= 1) return 1
  return Math.sqrt(numLayers) / numLayers
}

export function calcActivations(layers, batchSize, precisionBytes, gradientCheckpointing = false) {
  const factor = gradientCheckpointing ? calcGradientCheckpointingFactor(layers.length) : 1
  const perLayer = layers.map((layer) => {
    const seqLen = layer.seqLen || 1
    const hiddenDim = layer.units || 1
    const memGB = (batchSize * seqLen * hiddenDim * precisionBytes * factor) / 1e9
    return { layerId: layer.id, memGB }
  })
  const total = perLayer.reduce((sum, l) => sum + l.memGB, 0)
  return { total, perLayer }
}


export function calcGradients(weightsResult) {
  return weightsResult.total
}


export function calcOptimizer(weightsResult, optimizerType) {
  const multiplier =
    optimizerType === 'adam'     ? 2 :
    optimizerType === 'adamw'    ? 2 :
    optimizerType === 'adam8bit' ? 0.5 : 1
  return weightsResult.total * multiplier
}


export function calcTotal(weights, activations, gradients, optimizer, mode, includeOverhead) {
  const weightsGB = weights.total
  const activationsGB = activations.total
  const gradientsGB = mode === 'training' ? gradients : 0
  const optimizerGB = mode === 'training' ? optimizer : 0

  const baseTotal = weightsGB + activationsGB + gradientsGB + optimizerGB
  const overheadGB = includeOverhead ? baseTotal * 0.2 : 0
  const total = baseTotal + overheadGB

  return {
    total,
    weightsGB,
    activationsGB,
    gradientsGB,
    optimizerGB,
    overheadGB,
    breakdown: { weights: weightsGB, activations: activationsGB, gradients: gradientsGB, optimizer: optimizerGB, 
      overhead: overheadGB },
  }
}



export function getGPUFitStatus(totalGB, customGPUs = []) {
  const builtIn = Object.entries(GPU_VRAM)
    .map(([name, vramGB]) => ({
      name,
      vramGB,
      fits: totalGB <= vramGB,
      marginGB: parseFloat((vramGB - totalGB).toFixed(3)),
      source: 'builtin',
    }))

  const custom = customGPUs.map(g => ({
    name: g.name,
    vramGB: g.vramGB,
    fits: totalGB <= g.vramGB,
    marginGB: parseFloat((g.vramGB - totalGB).toFixed(3)),
    source: 'custom',
  }))

  return [...builtIn, ...custom].sort((a, b) => a.vramGB - b.vramGB)
}


export function runMemoryPipeline({ layers, batchSize, precisionBytes, mode, optimizerType, includeOverhead, 
                                     gradientCheckpointing = false, customGPUs = [] }) {
  const weights     = calcWeights(layers, precisionBytes)
  const activations = calcActivations(layers, batchSize, precisionBytes, gradientCheckpointing)
  const gradients   = calcGradients(weights)
  const optimizer   = calcOptimizer(weights, optimizerType)
  const totals      = calcTotal(weights, activations, gradients, optimizer, mode, includeOverhead)
  const gpuFit      = getGPUFitStatus(totals.total, customGPUs)

  const dominant = Object.entries(totals.breakdown)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)[0]?.[0] ?? '—'

  const recommended = gpuFit.filter((g) => g.fits).sort((a, b) => a.vramGB - b.vramGB)[0] ?? null

 
  const totalParams = layers.reduce((s, l) => s + calcLayerParams(l), 0)
  const paramsPerGB = totalParams / Math.max(totals.total, 0.001)
  const paramScore  = Math.min(100, (paramsPerGB / 1e9) * 100)
  const utilScore   = (gpuFit.filter(g => g.fits).length / Math.max(gpuFit.length, 1)) * 100
  const efficiencyScore = Math.round(paramScore * 0.6 + utilScore * 0.4)

  
  const activNormal = calcActivations(layers, batchSize, precisionBytes, false)
  const gcSavingsGB = gradientCheckpointing ? +(activNormal.total - activations.total).toFixed(3) : 0

  return { weights, activations, totals, gpuFit, dominant, recommended, efficiencyScore, gcSavingsGB }
}

 
export function sweepBatchSizes(config, batchSizes = [1, 2, 4, 8, 16, 32, 64, 128, 256]) {
  return batchSizes.map((batchSize) => {
    const r = runMemoryPipeline({ ...config, batchSize })
    const fits = {}
    r.gpuFit.forEach(g => { fits[g.name] = g.fits })
    return { batchSize, totalGB: +r.totals.total.toFixed(3), fits }
  })
}