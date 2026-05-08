
export function inferConv2D(inputShape, { filters, kernelSize, stride, padding, dilation = 1 }) {
    if (!inputShape || inputShape.length < 2) {
      return { error: 'MISSING_INPUT', shape: null }
    }
  
    const [batch, , H, W] = inputShape.length === 4
      ? inputShape
      : [inputShape[0], inputShape[1], null, null]
  
    if (inputShape.length === 2) {
      return { error: 'NOT_FLATTENED_INPUT', shape: null,
        message: 'Conv2D expects a 4D tensor [B,C,H,W]. Received a 2D tensor. Remove Flatten or reorder layers.' }
    }
  
    if (!H || !W) return { error: 'INVALID_SHAPE', shape: null }
  
    const effectiveKernel = dilation * (kernelSize - 1) + 1
    const outH = Math.floor((H + 2 * padding - effectiveKernel) / stride + 1)
    const outW = Math.floor((W + 2 * padding - effectiveKernel) / stride + 1)
  
    if (outH <= 0 || outW <= 0) {
      return {
        error: 'KERNEL_TOO_LARGE',
        shape: null,
        message: `Conv2D kernel [${kernelSize}×${kernelSize}] cannot slide over feature map [${H}×${W}]. ` +
          `Output dimensions would be [${outH}×${outW}]. ` +
          `Try: increase padding to ${Math.ceil((kernelSize - H) / 2) + 1}, ` +
          `reduce kernel_size to ${Math.max(1, Math.min(H, W)) % 2 === 0 ? Math.max(1, Math.min(H, W)) - 1 : Math.max(1, Math.min(H, W))}, ` +
          `or add a larger feature map before this layer.`,
      }
    }
  
    return { shape: [batch, filters, outH, outW], error: null }
  }
  

  export function inferMaxPool2D(inputShape, { kernelSize, stride, padding = 0 }) {
    if (!inputShape || inputShape.length !== 4) {
      return { error: 'INVALID_INPUT', shape: null,
        message: 'MaxPool2D expects a 4D tensor [B,C,H,W].' }
    }
  
    const [batch, channels, H, W] = inputShape
    const outH = Math.floor((H + 2 * padding - kernelSize) / stride + 1)
    const outW = Math.floor((W + 2 * padding - kernelSize) / stride + 1)
  
    if (outH <= 0 || outW <= 0) {
      return {
        error: 'KERNEL_TOO_LARGE',
        shape: null,
        message: `MaxPool2D kernel [${kernelSize}×${kernelSize}] with stride ${stride} ` +
          `cannot reduce [${H}×${W}] feature map. ` +
          `Try: reduce kernel_size to ${Math.max(2, Math.min(H, W))}, ` +
          `or add padding.`,
      }
    }
  
    return { shape: [batch, channels, outH, outW], error: null }
  }
  

  export function inferDense(inputShape, { units }) {
    if (!inputShape) return { error: 'MISSING_INPUT', shape: null }
  
    if (inputShape.length > 2) {
      return {
        error: 'NOT_FLATTENED',
        shape: null,
        message: `Dense layer received a ${inputShape.length}D tensor ${formatShape(inputShape)}. ` +
          `Dense requires a 2D tensor [B, features]. ` +
          `Add a Flatten layer before this Dense layer.`,
      }
    }
  
    const [batch] = inputShape
    return { shape: [batch, units], error: null }
  }
  

  export function inferFlatten(inputShape) {
    if (!inputShape) return { error: 'MISSING_INPUT', shape: null }
    const [batch, ...rest] = inputShape
    const flat = rest.reduce((a, b) => a * b, 1)
    return { shape: [batch, flat], error: null }
  }
  
 
  export function inferBatchNorm(inputShape) {
    if (!inputShape) return { error: 'MISSING_INPUT', shape: null }
    return { shape: [...inputShape], error: null }
  }
  

  export function inferDropout(inputShape) {
    if (!inputShape) return { error: 'MISSING_INPUT', shape: null }
    return { shape: [...inputShape], error: null }
  }
  

  export function inferLayer(layerType, inputShape, config) {
    switch (layerType) {
      case 'Conv2D': return inferConv2D(inputShape, config)
      case 'MaxPool2D': return inferMaxPool2D(inputShape, config)
      case 'Dense': return inferDense(inputShape, config)
      case 'Flatten': return inferFlatten(inputShape)
      case 'BatchNorm': return inferBatchNorm(inputShape)
      case 'Dropout': return inferDropout(inputShape)
      default: return { shape: inputShape, error: null }
    }
  }
  

  export function topoSort(nodes, edges) {
    const adj = {}
    const inDegree = {}
  
    for (const n of nodes) {
      adj[n.id] = []
      inDegree[n.id] = 0
    }
  
    for (const e of edges) {
      if (adj[e.source] !== undefined) adj[e.source].push(e.target)
      if (inDegree[e.target] !== undefined) inDegree[e.target]++
    }
  
    const queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id)
    const sorted = []
  
    while (queue.length > 0) {
      const curr = queue.shift()
      sorted.push(curr)
      for (const neighbor of (adj[curr] || [])) {
        inDegree[neighbor]--
        if (inDegree[neighbor] === 0) queue.push(neighbor)
      }
    }
  
    return sorted
  }
  
  export function propagateGraph(nodes, edges, inputShape) {
    const results = {}
    const sorted = topoSort(nodes, edges)
  
    // Map: nodeId → output shape
    const outputOf = {}
  
    // Find InputNode
    const inputNode = nodes.find(n => n.type === 'inputNode' || n.data?.layerType === 'Input')
    if (inputNode) {
      outputOf[inputNode.id] = inputShape
      results[inputNode.id] = {
        inputShape: null,
        outputShape: inputShape,
        error: null,
        message: null,
      }
    }
  
    for (const nodeId of sorted) {
      const node = nodes.find(n => n.id === nodeId)
      if (!node) continue
      if (node.data?.layerType === 'Input') continue
  
      // Find incoming edges
      const incomingEdges = edges.filter(e => e.target === nodeId)
      let inShape = null
  
      if (incomingEdges.length > 0) {
        // Use first incoming edge's source output
        const sourceId = incomingEdges[0].source
        inShape = outputOf[sourceId] || null
      }
  
      if (!inShape) {
        results[nodeId] = {
          inputShape: null,
          outputShape: null,
          error: 'NO_INPUT',
          message: 'No connected input. Connect this layer to an upstream layer.',
        }
        continue
      }
  
      const { shape, error, message } = inferLayer(
        node.data?.layerType,
        inShape,
        node.data?.config || {}
      )
  
      results[nodeId] = {
        inputShape: inShape,
        outputShape: shape,
        error,
        message: message || generateErrorMessage(node.data?.layerType, inShape, node.data?.config, error),
      }
  
      outputOf[nodeId] = shape
    }
  
    return results
  }
  
  /**
   * Generate human-readable error messages
   */
  export function generateErrorMessage(layerType, inputShape, config, errorType) {
    if (!errorType) return null
  
    const shapeStr = inputShape ? formatShape(inputShape) : 'unknown'
  
    const messages = {
      KERNEL_TOO_LARGE: `Kernel size too large for input ${shapeStr}. Reduce kernel size or add padding.`,
      NOT_FLATTENED: `${layerType} received ${shapeStr}. A Flatten layer is required before Dense.`,
      NOT_FLATTENED_INPUT: `Conv2D requires a 4D tensor. Got ${shapeStr}. Check layer ordering.`,
      NEGATIVE_DIM: `Output dimension became negative. Input ${shapeStr} is too small for the given parameters.`,
      MISSING_INPUT: `No input connected to this layer.`,
      INVALID_INPUT: `Invalid input shape ${shapeStr} for ${layerType}.`,
      NO_INPUT: `This layer has no upstream connection.`,
    }
  
    return messages[errorType] || `Shape error in ${layerType}: ${errorType}`
  }
  
  /**
   * Format shape array as string: [B, C, H, W]
   */
  export function formatShape(shape, format = 'NCHW') {
    if (!shape) return '???'
    if (format === 'NHWC' && shape.length === 4) {
      const [b, c, h, w] = shape
      return `[${b}, ${h}, ${w}, ${c}]`
    }
    return `[${shape.join(', ')}]`
  }
  
  /**
   * Count trainable parameters for a layer
   */
  export function countParams(layerType, inputShape, config) {
    if (!inputShape) return 0
  
    switch (layerType) {
      case 'Conv2D': {
        const inChannels = inputShape.length === 4 ? inputShape[1] : inputShape[1]
        const { filters = 64, kernelSize = 3 } = config
        return filters * inChannels * kernelSize * kernelSize + filters
      }
      case 'Dense': {
        const inFeatures = inputShape[inputShape.length - 1]
        const { units = 256 } = config
        return inFeatures * units + units
      }
      case 'BatchNorm': {
        const channels = inputShape[1]
        return channels * 4 // gamma, beta, running_mean, running_var
      }
      default:
        return 0
    }
  }
  