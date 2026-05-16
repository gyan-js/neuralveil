import { create } from 'zustand'
import { PRECISION_BYTES } from '../engine/precisionBytes.js'
import { runMemoryPipeline, sweepBatchSizes } from '../engine/memoryEngine.js'
import { LAYER_TYPE_MAP } from '../constants/layerTypes.js'

let _nextId = 1
const nextId = () => _nextId++

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
  }
  const results = runMemoryPipeline(pipelineConfig)
  const sweepResults = sweepBatchSizes(pipelineConfig)
  return { results, sweepResults }
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

  addLayer(type) {
    const def = LAYER_TYPE_MAP[type]
    const newLayer = {
      id: nextId(),
      type,
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
    set((s) => {
      const next = { ...s, batchSize: Math.max(1, n) }
      return { ...next, ...recalculate(next) }
    })
  },

  setPrecision(p) {
    set((s) => {
      const next = { ...s, precision: p }
      return { ...next, ...recalculate(next) }
    })
  },

  setMode(m) {
    set((s) => {
      const next = { ...s, mode: m }
      return { ...next, ...recalculate(next) }
    })
  },

  setOptimizer(o) {
    set((s) => {
      const next = { ...s, optimizerType: o }
      return { ...next, ...recalculate(next) }
    })
  },

  setIncludeOverhead(v) {
    set((s) => {
      const next = { ...s, includeOverhead: v }
      return { ...next, ...recalculate(next) }
    })
  },

  // V2
  setGradientCheckpointing(v) {
    set((s) => {
      const next = { ...s, gradientCheckpointing: v }
      return { ...next, ...recalculate(next) }
    })
  },

  loadPreset(json) {
    _nextId = 1
    const layers = (json.layers || []).map((l) => ({ ...l, id: nextId() }))
    _nextId = layers.length + 1
    set((s) => {
      const next = {
        ...s,
        layers,
        batchSize: json.batchSize ?? 1,
        precision: json.precision ?? 'fp16',
        mode: json.mode ?? 'inference',
        optimizerType: json.optimizerType ?? 'adam',
      }
      return { ...next, ...recalculate(next) }
    })
  },

  clearLayers() {
    set((s) => {
      const next = { ...s, layers: [] }
      return { ...next, ...recalculate(next) }
    })
  },
}))

export default useMemoryStore