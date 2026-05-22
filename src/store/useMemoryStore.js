import { create } from 'zustand'
import { PRECISION_BYTES } from '../engine/precisionBytes.js'
import { runMemoryPipeline, sweepBatchSizes } from '../engine/memoryEngine.js'
import { estimateCost, estimateTrainingHours } from '../engine/costEngine.js'
import { analyzeConstraints, generateCode } from '../engine/codegenEngine.js'
import { LAYER_TYPE_MAP } from '../constants/layerTypes.js'
import { calcQuantComparisonTable } from '../engine/quantEngine.js'
import { runDistributedComparison } from '../engine/distributedEngine.js'

let _nextId = 1
const nextId = () => _nextId++


function loadCustomGPUs() {
  try {
    const raw = localStorage.getItem('nv_customGPUs')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveCustomGPUs(gpus) {
  try { localStorage.setItem('nv_customGPUs', JSON.stringify(gpus)) } catch {}
}

function recalculate(state) {
  const precisionBytes = PRECISION_BYTES[state.precision]
  const pipelineConfig = {
    layers: state.layers,
    batchSize: state.batchSize,
    precisionBytes,
    mode: state.mode,
    optimizerType: state.optimizerType,
    includeOverhead: state.includeOverhead,
    gradientCheckpointing: state.gradientCheckpointing,
    customGPUs: state.customGPUs,
  }
  const results      = runMemoryPipeline(pipelineConfig)
  const sweepResults = sweepBatchSizes(pipelineConfig)

  const constraintFlags = analyzeConstraints(results, {
    mode: state.mode,
    precision: state.precision,
    optimizerType: state.optimizerType,
    batchSize: state.batchSize,
  })
  const generatedCode = generateCode(constraintFlags, {
    mode: state.mode,
    precision: state.precision,
    optimizerType: state.optimizerType,
    batchSize: state.batchSize,
  })


  const fp32Bytes = PRECISION_BYTES['fp32'] ?? 4
  const fp32WeightsGB = results.weights.total * (fp32Bytes / precisionBytes)
  const quantComparisonResults = calcQuantComparisonTable(
    fp32WeightsGB,
    results.activations.total,
    state.mode,
  )

  
  let distributedResults = null
  if (state.mode === 'training') {
    distributedResults = runDistributedComparison({
      layers:       state.layers,
      weightsGB:    results.totals.weightsGB,
      activationsGB: results.totals.activationsGB,
      gradientsGB:  results.totals.gradientsGB,
      optimizerGB:  results.totals.optimizerGB,
      numGPUs:      state.distributedConfig.numGPUs,
      strategy:     state.distributedConfig.strategy,
    })
  }

 
  let costResults = null
  if (state.costConfig && state.mode === 'training') {
    const { datasetTokens, numEpochs, numGPUs } = state.costConfig
    const totalParams = state.layers.reduce((s, l) => {
      const w = results.weights.perLayer.find(p => p.layerId === l.id)
      return s + (w?.params ?? 0)
    }, 0)
    const timeEst = estimateTrainingHours({
      datasetTokens, batchSize: state.batchSize, seqLen: 512,
      numEpochs, numGPUs, totalParams,
    })
    const costEst = estimateCost(results.totals.total, timeEst.totalHours, numGPUs)
    costResults = { ...costEst, timeEstimate: timeEst }
  }

  return {
    results,
    sweepResults,
    generatedCode,
    constraintFlags,
    costResults,
    quantComparisonResults,
    distributedResults,
  }
}

const useMemoryStore = create((set, get) => ({

  layers: [],
  batchSize: 1,
  precision: 'fp16',
  mode: 'inference',
  optimizerType: 'adam',
  includeOverhead: true,
  gradientCheckpointing: false,
  results: null,
  sweepResults: [],
  selectedModel: 'GPT-2 Small',

 
  customGPUs: loadCustomGPUs(),
  costConfig: null,
  costResults: null,
  generatedCode: [],
  constraintFlags: {},

  
  quantComparisonResults: [],       
  selectedQuantSchemes: ['fp32', 'fp16', 'bf16', 'int8', 'int4_gptq', 'int4_awq', 'nf4_bnb'], // all enabled
  activeQuantScheme: 'fp32',       

  
  distributedConfig: { numGPUs: 1, strategy: 'DDP' },
  distributedResults: null,          

  
  addLayer(type) {
    const def = LAYER_TYPE_MAP[type]
    const newLayer = {
      id: nextId(), type,
      units: def?.defaults.units ?? 256,
      output: def?.defaults.output ?? 256,
      seqLen: def?.defaults.seqLen ?? 1,
      extra: def?.defaults.extra ?? 0,
    }
    set((s) => {
      const next = { ...s, layers: [...s.layers, newLayer] }
      return { ...next, ...recalculate(next) }
    })
  },

  updateLayer(id, config) {
    set((s) => {
      const layers = s.layers.map((l) => (l.id === id ? { ...l, ...config } : l))
      const next = { ...s, layers }
      return { ...next, ...recalculate(next) }
    })
  },

  removeLayer(id) {
    set((s) => {
      const layers = s.layers.filter((l) => l.id !== id)
      const next = { ...s, layers }
      return { ...next, ...recalculate(next) }
    })
  },

  setBatchSize(n) {
    set((s) => { const next = { ...s, batchSize: Math.max(1, n) }; return { ...next, ...recalculate(next) } })
  },
  setPrecision(p) {
    set((s) => { const next = { ...s, precision: p }; return { ...next, ...recalculate(next) } })
  },
  setMode(m) {
    set((s) => { const next = { ...s, mode: m }; return { ...next, ...recalculate(next) } })
  },
  setOptimizer(o) {
    set((s) => { const next = { ...s, optimizerType: o }; return { ...next, ...recalculate(next) } })
  },
  setIncludeOverhead(v) {
    set((s) => { const next = { ...s, includeOverhead: v }; return { ...next, ...recalculate(next) } })
  },
  setGradientCheckpointing(v) {
    set((s) => { const next = { ...s, gradientCheckpointing: v }; return { ...next, ...recalculate(next) } })
  },

  
  setCostConfig(cfg) {
    set((s) => { const next = { ...s, costConfig: cfg }; return { ...next, ...recalculate(next) } })
  },

  
  addCustomGPU(gpu) {
    set((s) => {
      const customGPUs = [...s.customGPUs, { ...gpu, source: 'custom' }]
      saveCustomGPUs(customGPUs)
      const next = { ...s, customGPUs }
      return { ...next, ...recalculate(next) }
    })
  },
  removeCustomGPU(name) {
    set((s) => {
      const customGPUs = s.customGPUs.filter(g => g.name !== name)
      saveCustomGPUs(customGPUs)
      const next = { ...s, customGPUs }
      return { ...next, ...recalculate(next) }
    })
  },

 
  setSelectedQuantSchemes(schemes) {
    set((s) => ({ ...s, selectedQuantSchemes: schemes }))
  },
  setActiveQuantScheme(scheme) {
    
    set((s) => {
      const next = { ...s, activeQuantScheme: scheme }
      return { ...next, ...recalculate(next) }
    })
  },

 
  setNumGPUs(n) {
    set((s) => {
      const next = { ...s, distributedConfig: { ...s.distributedConfig, numGPUs: Math.max(1, n) } }
      return { ...next, ...recalculate(next) }
    })
  },
  setDistributedStrategy(strategy) {
    set((s) => {
      const next = { ...s, distributedConfig: { ...s.distributedConfig, strategy } }
      return { ...next, ...recalculate(next) }
    })
  },

  setSelectedModel(name) {
    set(() => ({ selectedModel: name }))
  },

 
  loadPreset(json) {
    _nextId = 1
    const layers = (json.layers || []).map((l) => ({ ...l, id: nextId() }))
    _nextId = layers.length + 1
    set((s) => {
      const next = {
        ...s, layers,
        batchSize: json.batchSize ?? 1,
        precision: json.precision ?? 'fp16',
        mode: json.mode ?? 'inference',
        optimizerType: json.optimizerType ?? 'adam',
      }
      return { ...next, ...recalculate(next) }
    })
  },

  clearLayers() {
    set((s) => { const next = { ...s, layers: [], selectedModel: 'Custom' }; return { ...next, ...recalculate(next) } })
  },
}))

export default useMemoryStore