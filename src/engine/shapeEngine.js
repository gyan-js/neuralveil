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


/**
 * inferMerge — handles ADD and CONCAT modes for skip/residual connections
 * @param {Array<Array<number>>} shapes — array of input shapes from all parent nodes
 * @param {string} mode — 'add' | 'concat'
 */
export function inferMerge(shapes, mode = 'add') {
  // Filter out null/undefined shapes
  const validShapes = shapes.filter(s => s && s.length > 0)

  if (validShapes.length === 0) {
    return { error: 'NO_INPUT', shape: null, message: 'Merge node has no connected inputs.' }
  }

  if (validShapes.length === 1) {
    return { error: 'SINGLE_INPUT', shape: null, message: 'Merge node needs at least 2 inputs to merge.' }
  }

  const ref = validShapes[0]

  if (mode === 'add') {
    // ADD: all shapes must be identical
    for (let i = 1; i < validShapes.length; i++) {
      const s = validShapes[i]
      if (s.length !== ref.length || s.some((d, idx) => d !== ref[idx])) {
        return {
          error: 'SHAPE_MISMATCH',
          shape: null,
          message: `ADD merge requires identical shapes. ` +
            `Input 1: ${formatShape(ref)}, Input ${i + 1}: ${formatShape(s)}. ` +
            `Shapes must match exactly for element-wise addition.`,
        }
      }
    }
    return { shape: [...ref], error: null }
  }

  if (mode === 'concat') {
    // CONCAT along channel dim (dim=1 for 4D, dim=1 for 2D)
    // Validate batch and spatial dims match, sum channels
    const refBatch = ref[0]
    const refSpatial = ref.slice(2) // H, W (or empty for 2D)

    for (let i = 1; i < validShapes.length; i++) {
      const s = validShapes[i]

      if (s.length !== ref.length) {
        return {
          error: 'SHAPE_MISMATCH',
          shape: null,
          message: `CONCAT merge requires same tensor rank. ` +
            `Input 1 is ${ref.length}D, Input ${i + 1} is ${s.length}D.`,
        }
      }

      if (s[0] !== refBatch) {
        return {
          error: 'BATCH_MISMATCH',
          shape: null,
          message: `CONCAT merge: batch sizes must match. ` +
            `Input 1 batch=${refBatch}, Input ${i + 1} batch=${s[0]}.`,
        }
      }

      const sSpatial = s.slice(2)
      if (sSpatial.some((d, idx) => d !== refSpatial[idx])) {
        return {
          error: 'SPATIAL_MISMATCH',
          shape: null,
          message: `CONCAT merge: spatial dimensions must match. ` +
            `Input 1: H×W=${refSpatial.join('×')}, Input ${i + 1}: ${sSpatial.join('×')}. ` +
            `Use padding or resize to align spatial dims.`,
        }
      }
    }

    // Sum channels (dim 1)
    const sumC = validShapes.reduce((acc, s) => acc + s[1], 0)
    const outShape = [refBatch, sumC, ...refSpatial]
    return { shape: outShape, error: null }
  }

  return { error: 'UNKNOWN_MODE', shape: null, message: `Unknown merge mode: ${mode}` }
}


export function inferLayer(layerType, inputShape, config) {
  switch (layerType) {
    case 'Conv2D': return inferConv2D(inputShape, config)
    case 'MaxPool2D': return inferMaxPool2D(inputShape, config)
    case 'Dense': return inferDense(inputShape, config)
    case 'Flatten': return inferFlatten(inputShape)
    case 'BatchNorm': return inferBatchNorm(inputShape)
    case 'Dropout': return inferDropout(inputShape)
    // Merge is handled separately in propagateGraph (needs multiple inputs)
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

    // Collect ALL incoming parent shapes (supports multi-input merge nodes)
    const incomingEdges = edges.filter(e => e.target === nodeId)
    const parentShapes = incomingEdges.map(e => outputOf[e.source] || null)

    // For Merge nodes, pass all parent shapes to inferMerge
    if (node.data?.layerType === 'Merge') {
      const mode = node.data?.config?.mode || 'add'

      if (incomingEdges.length === 0) {
        results[nodeId] = {
          inputShapes: [],
          inputShape: null,
          outputShape: null,
          error: 'NO_INPUT',
          message: 'No connected input. Connect this layer to an upstream layer.',
        }
        outputOf[nodeId] = null
        continue
      }

      const { shape, error, message } = inferMerge(parentShapes, mode)

      results[nodeId] = {
        inputShapes: parentShapes,          // all parent shapes for display
        inputShape: parentShapes[0] || null, // first shape for compat
        outputShape: shape,
        error,
        message,
      }
      outputOf[nodeId] = shape
      continue
    }

    // Standard single-input layers
    let inShape = null
    if (incomingEdges.length > 0) {
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
    SHAPE_MISMATCH: `Shape mismatch in ${layerType}. Inputs must have compatible shapes.`,
    BATCH_MISMATCH: `Batch size mismatch in ${layerType}.`,
    SPATIAL_MISMATCH: `Spatial dimensions mismatch in ${layerType}.`,
    SINGLE_INPUT: `${layerType} requires at least 2 inputs.`,
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
      return channels * 4 // basically 4 channelss were added here ->>>> gamma, beta, running_mean, running_var !
    }
    default:
      return 0
  }
}