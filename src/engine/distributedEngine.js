
export function calcDDP(totalMemoryGB, numGPUs) {
    const memPerGPU = totalMemoryGB // each GPU holds the full model
    const communicationOverheadGB = +(totalMemoryGB * 0.05).toFixed(3)  // weights * 5%
    
    const effectiveComm = numGPUs > 1 ? communicationOverheadGB : 0
    const totalMemAcrossGPUs = +(memPerGPU * numGPUs).toFixed(3)
  
    return {
      strategy: 'DDP',
      memPerGPU: +memPerGPU.toFixed(3),
      totalMemAcrossGPUs,
      communicationOverheadGB: +effectiveComm.toFixed(3),
      notes: 'Each GPU holds full model + gradients + optimizer state. Best when model fits on one GPU.',
    }
  }
  

  export function calcFSDP(weightsGB, gradientsGB, optimizerGB, activationsGB, numGPUs) {
    const shardedGB = (weightsGB + gradientsGB + optimizerGB) / numGPUs
    const communicationBuffer = +((weightsGB / numGPUs) * 0.10).toFixed(3)
    const memPerGPU = +(shardedGB + activationsGB + communicationBuffer).toFixed(3)
    const totalMemAcrossGPUs = +(memPerGPU * numGPUs).toFixed(3)
  
    return {
      strategy: 'FSDP',
      memPerGPU,
      shardedGB: +shardedGB.toFixed(3),
      activationsGB: +activationsGB.toFixed(3),
      communicationBuffer,
      totalMemAcrossGPUs,
      notes: 'Weights, grads, optimizer sharded across N GPUs. Activations remain full per GPU. Use for models that don\'t fit on one GPU.',
    }
  }
  
  export function calcTensorParallel(weightsGB, activationsGB, gradientsGB, optimizerGB, numGPUs) {
    const communicationBuffer = +((activationsGB / numGPUs) * 0.15).toFixed(3)
    const memPerGPU = +(
      (weightsGB + gradientsGB + optimizerGB) / numGPUs +
      activationsGB / numGPUs +
      communicationBuffer
    ).toFixed(3)
    const totalMemAcrossGPUs = +(memPerGPU * numGPUs).toFixed(3)
  
    return {
      strategy: 'Tensor Parallel',
      memPerGPU,
      communicationBuffer,
      totalMemAcrossGPUs,
      notes: 'Each GPU holds 1/N of every weight matrix. Activations also split. High communication bandwidth requirement — needs NVLink or InfiniBand.',
    }
  }
  

  export function calcPipelineParallel(layers, weightsGB, gradientsGB, optimizerGB, activationsGB, numGPUs) {
    const numLayers   = layers.length || 1
    const layerFrac   = 1 / numGPUs
    const stageWeights    = +(weightsGB    * layerFrac).toFixed(3)
    const stageGradients  = +(gradientsGB  * layerFrac).toFixed(3)
    const stageOptimizer  = +(optimizerGB  * layerFrac).toFixed(3)

    const stageActivations = +(activationsGB * layerFrac).toFixed(3)
    const memPerGPU = +(stageWeights + stageGradients + stageOptimizer + stageActivations).toFixed(3)
    const totalMemAcrossGPUs = +(memPerGPU * numGPUs).toFixed(3)
  
    const bubbleRatio = +((numGPUs - 1) / numGPUs * 100).toFixed(1)
  
    return {
      strategy: 'Pipeline Parallel',
      memPerGPU,
      stageWeights,
      stageGradients,
      stageOptimizer,
      stageActivations,
      totalMemAcrossGPUs,
      communicationOverheadGB: 0,
      pipelineBubbleNote: `~${bubbleRatio}% pipeline bubble overhead with ${numGPUs} stages. Use gradient accumulation to amortize.`,
      notes: `Each GPU holds 1/${numGPUs} of layers. Low communication but pipeline bubble reduces efficiency.`,
    }
  }

  export function runDistributedComparison({ layers, weightsGB, activationsGB, gradientsGB, optimizerGB, numGPUs, strategy }) {
    const totalMemoryGB = weightsGB + activationsGB + gradientsGB + optimizerGB
  
    const ddp    = calcDDP(totalMemoryGB, numGPUs)
    const fsdp   = calcFSDP(weightsGB, gradientsGB, optimizerGB, activationsGB, numGPUs)
    const tensor = calcTensorParallel(weightsGB, activationsGB, gradientsGB, optimizerGB, numGPUs)
    const pipe   = calcPipelineParallel(layers, weightsGB, gradientsGB, optimizerGB, activationsGB, numGPUs)
  
  
    const all = [ddp, fsdp, tensor, pipe]
    const sorted = [...all].sort((a, b) => a.memPerGPU - b.memPerGPU)
    const recommended = sorted[0]
  
    return {
      ddp,
      fsdp,
      tensor,
      pipe,
      recommended,
      all,
      activeResult: all.find(r => r.strategy.replace(' ', '') === strategy.replace(' ', '')) ?? ddp,
    }
  }