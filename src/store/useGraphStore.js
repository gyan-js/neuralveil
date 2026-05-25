import { create } from 'zustand'
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import { propagateGraph, countParams } from '../engine/shapeEngine.js'
import { LAYER_DEFAULTS } from '../constants/layerDefaults.js'
import LZString from 'lz-string'

let nodeCounter = 10

function createDefaultGraph() {
  const nodes = [
    {
      id: 'input',
      type: 'inputNode',
      position: { x: 300, y: 30 },
      deletable: false,
      data: { layerType: 'Input', config: {}, bootDelay: 0 },
    },
    {
      id: 'conv1',
      type: 'layerNode',
      position: { x: 300, y: 155 },
      data: { layerType: 'Conv2D', config: { filters: 64, kernelSize: 3, stride: 1, padding: 1, dilation: 1 }, bootDelay: 1 },
    },
    {
      id: 'pool1',
      type: 'layerNode',
      position: { x: 300, y: 290 },
      data: { layerType: 'MaxPool2D', config: { kernelSize: 2, stride: 2, padding: 0 }, bootDelay: 2 },
    },
    {
      id: 'conv2',
      type: 'layerNode',
      position: { x: 300, y: 420 },
      data: { layerType: 'Conv2D', config: { filters: 128, kernelSize: 3, stride: 1, padding: 1, dilation: 1 }, bootDelay: 3 },
    },
    {
      id: 'pool2',
      type: 'layerNode',
      position: { x: 300, y: 555 },
      data: { layerType: 'MaxPool2D', config: { kernelSize: 2, stride: 2, padding: 0 }, bootDelay: 4 },
    },
    {
      id: 'flat1',
      type: 'layerNode',
      position: { x: 300, y: 685 },
      data: { layerType: 'Flatten', config: {}, bootDelay: 5 },
    },
    {
      id: 'fc1',
      type: 'layerNode',
      position: { x: 300, y: 810 },
      data: { layerType: 'Dense', config: { units: 256 }, bootDelay: 6 },
    },
    {
      id: 'drop1',
      type: 'layerNode',
      position: { x: 300, y: 940 },
      data: { layerType: 'Dropout', config: { p: 0.5 }, bootDelay: 7 },
    },
  ]

  const edges = [
    { id: 'e-input-conv1', source: 'input', target: 'conv1', type: 'shapeEdge' },
    { id: 'e-conv1-pool1', source: 'conv1', target: 'pool1', type: 'shapeEdge' },
    { id: 'e-pool1-conv2', source: 'pool1', target: 'conv2', type: 'shapeEdge' },
    { id: 'e-conv2-pool2', source: 'conv2', target: 'pool2', type: 'shapeEdge' },
    { id: 'e-pool2-flat1', source: 'pool2', target: 'flat1', type: 'shapeEdge' },
    { id: 'e-flat1-fc1',  source: 'flat1', target: 'fc1',   type: 'shapeEdge' },
    { id: 'e-fc1-drop1',  source: 'fc1',   target: 'drop1', type: 'shapeEdge' },
  ]

  return { nodes, edges }
}

const DEFAULT_INPUT_SHAPE = [1, 3, 224, 224]

function getNodeType(layerType) {
  if (layerType === 'Input') return 'inputNode'
  if (layerType === 'Merge') return 'mergeNode'
  return 'layerNode'
}

function serializeToURL(nodes, edges, inputShape, format) {
  const payload = {
    v: '1',
    format,
    inputShape,
    nodes: nodes.map(n => ({
      id: n.id,
      type: n.data?.layerType,
      position: n.position,
      config: n.data?.config || {},
    })),
    edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
  }
  const json = JSON.stringify(payload)
  const compressed = LZString.compressToEncodedURIComponent(json)
  const url = `${window.location.origin}${window.location.pathname}#${compressed}`
  return url
}

function deserializeFromURL() {
  try {
    const hash = window.location.hash.slice(1)
    if (!hash) return null
    const json = LZString.decompressFromEncodedURIComponent(hash)
    if (!json) return null
    return JSON.parse(json)
  } catch {
    return null
  }
}
 

export const useGraphStore = create((set, get) => {

  const urlData = deserializeFromURL()

  let initialNodes, initialEdges, initialInputShape, initialFormat

  if (urlData) {
    initialNodes = urlData.nodes.map((n, i) => ({
      id: n.id,
      type: getNodeType(n.type),
      position: n.position,
      deletable: n.type !== 'Input',
      data: { layerType: n.type, config: n.config || {}, bootDelay: i },
    }))
    initialEdges = urlData.edges.map(e => ({ ...e, type: 'shapeEdge' }))
    initialInputShape = urlData.inputShape || DEFAULT_INPUT_SHAPE
    initialFormat = urlData.format || 'NCHW'
  } else {
    const { nodes, edges } = createDefaultGraph()
    initialNodes = nodes
    initialEdges = edges
    initialInputShape = DEFAULT_INPUT_SHAPE
    initialFormat = 'NCHW'
  }

  const initialResults = propagateGraph(initialNodes, initialEdges, initialInputShape)

  return {
    nodes: initialNodes,
    edges: initialEdges,
    inputShape: initialInputShape,
    format: initialFormat,
    selectedNodeId: null,
    shapeResults: initialResults,
    rippleNodes: new Set(),

    importErrors: [],
    importWarnings: [],
    importFramework: null,
    showCodeImport: false,

    
    executionMode: 'static',     
    cliErrors: [],               
    parseConfidence: null,     
    showCLIBanner: false,      

    onNodesChange: (changes) => {
      set(state => ({ nodes: applyNodeChanges(changes, state.nodes) }))
    },
    onEdgesChange: (changes) => {
      set(state => {
        const newEdges = applyEdgeChanges(changes, state.edges)
        const results = propagateGraph(state.nodes, newEdges, state.inputShape)
        return { edges: newEdges, shapeResults: results }
      })
    },
    onConnect: (connection) => {
      set(state => {
        const newEdges = addEdge({ ...connection, type: 'shapeEdge', id: `e-${Date.now()}` }, state.edges)
        const results = propagateGraph(state.nodes, newEdges, state.inputShape)
        return { edges: newEdges, shapeResults: results }
      })
    },

    addNode: (layerType, position) => {
      nodeCounter++
      const id = `node-${nodeCounter}`
      const newNode = {
        id,
        type: getNodeType(layerType),
        position,
        data: { layerType, config: { ...LAYER_DEFAULTS[layerType] }, bootDelay: 0 },
      }
      set(state => {
        const newNodes = [...state.nodes, newNode]
        const results = propagateGraph(newNodes, state.edges, state.inputShape)
        return { nodes: newNodes, shapeResults: results }
      })
      return id
    },

    updateNodeConfig: (nodeId, newConfig) => {
      set(state => {
        const newNodes = state.nodes.map(n =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, config: { ...n.data.config, ...newConfig } } }
            : n
        )
        const results = propagateGraph(newNodes, state.edges, state.inputShape)
        const ripple = new Set()
        for (const [id, r] of Object.entries(results)) {
          if (r.outputShape) ripple.add(id)
        }
        setTimeout(() => set({ rippleNodes: new Set() }), 700)
        return { nodes: newNodes, shapeResults: results, rippleNodes: ripple }
      })
    },

    updateInputShape: (newShape) => {
      set(state => {
        const results = propagateGraph(state.nodes, state.edges, newShape)
        return { inputShape: newShape, shapeResults: results }
      })
    },

    deleteNode: (nodeId) => {
      set(state => {
        const newNodes = state.nodes.filter(n => n.id !== nodeId)
        const newEdges = state.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
        const results = propagateGraph(newNodes, newEdges, state.inputShape)
        return {
          nodes: newNodes,
          edges: newEdges,
          shapeResults: results,
          selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        }
      })
    },

    toggleFormat: () => {
      set(state => {
        const newFormat = state.format === 'NCHW' ? 'NHWC' : 'NCHW'
        
        const results = propagateGraph(state.nodes, state.edges, state.inputShape, newFormat)
        return { format: newFormat, shapeResults: results }
      })
    },

    selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
    deselectNode: () => set({ selectedNodeId: null }),

    exportToURL: () => {
      const { nodes, edges, inputShape, format } = get()
      const url = serializeToURL(nodes, edges, inputShape, format)
      const hash = url.split('#')[1]
      window.history.replaceState(null, '', `#${hash}`)
      return url
    },

    loadFromJSON: (json) => {
      try {
        const data = typeof json === 'string' ? JSON.parse(json) : json
        const nodes = data.nodes.map((n, i) => ({
          id: n.id,
          type: getNodeType(n.type),
          position: n.position,
          deletable: n.type !== 'Input',
          data: { layerType: n.type, config: n.config || {}, bootDelay: i },
        }))
        const edges = data.edges.map(e => ({ ...e, type: 'shapeEdge' }))
        const inputShape = data.inputShape || DEFAULT_INPUT_SHAPE
        const results = propagateGraph(nodes, edges, inputShape)
        window.history.replaceState(null, '', window.location.pathname)
        set({ nodes, edges, inputShape, format: data.format || 'NCHW', shapeResults: results, selectedNodeId: null })
      } catch (e) {
        console.error('Failed to load JSON', e)
      }
    },


    openCodeImport: () => set({ showCodeImport: true }),
    closeCodeImport: () => set({ showCodeImport: false, importErrors: [], importWarnings: [] }),

   
     
    loadFromCLI: (cliJSON) => {
      try {
      
        if (!cliJSON?.nodes || !Array.isArray(cliJSON.nodes)) {
          throw new Error('Invalid CLI JSON: missing nodes array.')
        }
        if (!cliJSON?.edges || !Array.isArray(cliJSON.edges)) {
          throw new Error('Invalid CLI JSON: missing edges array.')
        }

        const nodes = cliJSON.nodes.map((n, i) => ({
          id: n.id,
          type: getNodeType(n.type),
          position: n.position || { x: 300, y: 30 + i * 135 },
          deletable: n.type !== 'Input',
          data: {
            layerType: n.type,
            config: n.config || {},
            bootDelay: i,
            // CLI-verified shape data
            verifiedInputShape:  n.verifiedInputShape  ?? null,
            verifiedOutputShape: n.verifiedOutputShape ?? null,
            paramCount:          n.paramCount          ?? 0,
            layerName:           n.layerName           ?? n.id,
            cliVerified: true,
          },
        }))

        const edges = cliJSON.edges.map(e => ({
          ...e,
          type: 'shapeEdge',
          id: e.id || `e-${e.source}-${e.target}`,
        }))

        const inputShape  = cliJSON.inputShape || get().inputShape
        const results     = propagateGraph(nodes, edges, inputShape)

        window.history.replaceState(null, '', window.location.pathname)

        set({
          nodes,
          edges,
          inputShape,
          shapeResults: results,
          selectedNodeId: null,
          executionMode: 'cli',
          cliErrors: cliJSON.errors || [],
          parseConfidence: 1.0,
          showCLIBanner: false,
          importErrors: [],
          importWarnings: cliJSON.warnings || [],
        })

        if ((cliJSON.warnings || []).length > 0) {
          setTimeout(() => set({ importWarnings: [] }), 10000)
        }
      } catch (e) {
        console.error('loadFromCLI failed:', e)
        set({ cliErrors: [e.message] })
      }
    },

    dismissCLIBanner: () => set({ showCLIBanner: false }),

    detectFrameworkLive: async (codeString) => {
      const { detectFramework } = await import('../engine/parseEngine.js')
      const fw = detectFramework(codeString || '')
      set({ importFramework: fw === 'unknown' ? null : fw })
    },

    importFromCode: async (codeString) => {
      const { parseWithFallback } = await import('../engine/parseEngine.js')

      if (!codeString || !codeString.trim()) {
        set({ importErrors: ['No code provided. Paste your PyTorch or Keras model.'], importWarnings: [] })
        return
      }

      const result = parseWithFallback(codeString)

      if (result.errors.length > 0 && result.nodes.length === 0) {
        set({
          importErrors: result.errors,
          importWarnings: result.warnings,
          importFramework: result.framework,
          executionMode: 'static',
          parseConfidence: result.confidence,
          showCLIBanner: result.needsCLI,
        })
        return
      }

      const json = {
        version: '1.0',
        format: get().format,
        inputShape: result.inputShape || get().inputShape,
        nodes: result.nodes,
        edges: result.edges,
      }

      get().loadFromJSON(json)

      set({
        showCodeImport: false,
        importErrors: [],
        importWarnings: result.warnings,
        importFramework: result.framework,
        executionMode: 'static',
        parseConfidence: result.confidence,
        showCLIBanner: result.needsCLI,
        cliErrors: [],
      })

      if (result.warnings.length > 0) {
        setTimeout(() => set({ importWarnings: [] }), 8000)
      }
    },

    getTotalParams: () => {
      const { nodes, shapeResults } = get()
      let total = 0
      for (const node of nodes) {
        if (node.data?.layerType === 'Input') continue
        const r = shapeResults[node.id]
        if (r?.inputShape) {
          total += countParams(node.data.layerType, r.inputShape, node.data.config || {})
        }
      }
      return total
    },

    getErrorCount: () => {
      const { shapeResults } = get()
      return Object.values(shapeResults).filter(r => r.error).length
    },
  }
})