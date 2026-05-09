// ─── NULL-SAFE MATH HELPERS ──────────────────────────────────────────────────
// null represents a dynamic / unknown dimension (PyTorch's None / -1)
// null * anything = null,  null + anything = null

function safeMul(a, b) {
  if (a === null || b === null) return null
  return a * b
}

function safeAdd(a, b) {
  if (a === null || b === null) return null
  return a + b
}

function safeFloorDiv(num, den) {
  if (num === null || den === null) return null
  return Math.floor(num / den)
}

// ─── LAYER INFERENCE ─────────────────────────────────────────────────────────

export function inferConv2D(inputShape, { filters, kernelSize, stride, padding, dilation = 1 }) {
  if (!inputShape || inputShape.length < 2) {
    return { error: 'MISSING_INPUT', shape: null }
  }

  const [batch, , H, W] = inputShape.length === 4
    ? inputShape
    : [inputShape[0], inputShape[1], null, null]

  if (inputShape.length === 2) {
    return {
      error: 'NOT_FLATTENED_INPUT', shape: null,
      message: 'Conv2D expects a 4D tensor [B,C,H,W]. Received a 2D tensor. Remove Flatten or reorder layers.',
    }
  }

  if (H === undefined || W === undefined) return { error: 'INVALID_SHAPE', shape: null }

  // Null spatial dims → propagate null
  if (H === null || W === null) {
    return { shape: [batch, filters, null, null], error: null }
  }

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
    return { error: 'INVALID_INPUT', shape: null, message: 'MaxPool2D expects a 4D tensor [B,C,H,W].' }
  }

  const [batch, channels, H, W] = inputShape

  // Null spatial dims → propagate null
  if (H === null || W === null) {
    return { shape: [batch, channels, null, null], error: null }
  }

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
  // If any spatial dim is null the flat size is unknown
  const hasNull = rest.some(d => d === null)
  const flat = hasNull ? null : rest.reduce((a, b) => a * b, 1)
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
 * inferReshape — user specifies target shape as [C, H, W] (batch is preserved).
 * Validates that product of new dims equals product of old dims (null-aware).
 */
export function inferReshape(inputShape, { targetC, targetH, targetW }) {
  if (!inputShape) return { error: 'MISSING_INPUT', shape: null }

  const [batch, ...rest] = inputShape
  const inProduct = rest.every(d => d !== null)
    ? rest.reduce((a, b) => a * b, 1)
    : null

  const outDims = [targetC, targetH, targetW].filter(d => d !== undefined && d !== null)

  if (outDims.length === 0) {
    return { error: 'INVALID_TARGET', shape: null, message: 'Reshape: specify at least one target dimension.' }
  }

  const outProduct = outDims.reduce((a, b) => a * b, 1)

  // Only validate when both products are known
  if (inProduct !== null && outProduct !== inProduct) {
    return {
      error: 'RESHAPE_MISMATCH',
      shape: null,
      message: `Reshape: input has ${inProduct} elements but target shape has ${outProduct} elements. ` +
        `They must be equal.`,
    }
  }

  // Build output shape: [batch, targetC, targetH?, targetW?]
  const outShape = [batch, targetC]
  if (targetH !== undefined && targetH !== null) outShape.push(targetH)
  if (targetW !== undefined && targetW !== null) outShape.push(targetW)

  return { shape: outShape, error: null }
}


/**
 * inferPermute — user specifies dim order as [0,1,2,3].
 * Output dims are input dims reordered.
 * e.g. NCHW [B,C,H,W] with perm [0,2,3,1] → NHWC [B,H,W,C]
 */
export function inferPermute(inputShape, { permutation }) {
  if (!inputShape) return { error: 'MISSING_INPUT', shape: null }
  if (!permutation || !Array.isArray(permutation)) {
    return { error: 'MISSING_PERMUTATION', shape: null, message: 'Permute: provide a permutation array.' }
  }

  const rank = inputShape.length

  if (permutation.length !== rank) {
    return {
      error: 'PERMUTATION_LENGTH',
      shape: null,
      message: `Permute: input is ${rank}D but permutation has ${permutation.length} entries. They must match.`,
    }
  }

  // Validate all indices are valid and unique
  const sorted = [...permutation].sort((a, b) => a - b)
  for (let i = 0; i < rank; i++) {
    if (sorted[i] !== i) {
      return {
        error: 'INVALID_PERMUTATION',
        shape: null,
        message: `Permute: [${permutation.join(',')}] is not a valid permutation of [0..${rank - 1}].`,
      }
    }
  }

  const outShape = permutation.map(i => inputShape[i])
  return { shape: outShape, error: null }
}


/**
 * inferMerge — handles ADD and CONCAT modes for skip/residual connections
 */
export function inferMerge(shapes, mode = 'add') {
  const validShapes = shapes.filter(s => s && s.length > 0)

  if (validShapes.length === 0) {
    return { error: 'NO_INPUT', shape: null, message: 'Merge node has no connected inputs.' }
  }

  if (validShapes.length === 1) {
    return { error: 'SINGLE_INPUT', shape: null, message: 'Merge node needs at least 2 inputs to merge.' }
  }

  const ref = validShapes[0]

  if (mode === 'add') {
    for (let i = 1; i < validShapes.length; i++) {
      const s = validShapes[i]
      // Skip mismatch check when either dim is null (dynamic)
      if (s.length !== ref.length || s.some((d, idx) => d !== null && ref[idx] !== null && d !== ref[idx])) {
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
    const refBatch = ref[0]
    const refSpatial = ref.slice(2)

    for (let i = 1; i < validShapes.length; i++) {
      const s = validShapes[i]

      if (s.length !== ref.length) {
        return {
          error: 'SHAPE_MISMATCH',
          shape: null,
          message: `CONCAT merge requires same tensor rank. Input 1 is ${ref.length}D, Input ${i + 1} is ${s.length}D.`,
        }
      }

      if (s[0] !== refBatch && s[0] !== null && refBatch !== null) {
        return {
          error: 'BATCH_MISMATCH',
          shape: null,
          message: `CONCAT merge: batch sizes must match. Input 1 batch=${refBatch}, Input ${i + 1} batch=${s[0]}.`,
        }
      }

      const sSpatial = s.slice(2)
      if (sSpatial.some((d, idx) => d !== null && refSpatial[idx] !== null && d !== refSpatial[idx])) {
        return {
          error: 'SPATIAL_MISMATCH',
          shape: null,
          message: `CONCAT merge: spatial dimensions must match. ` +
            `Input 1: H×W=${refSpatial.join('×')}, Input ${i + 1}: ${sSpatial.join('×')}. ` +
            `Use padding or resize to align spatial dims.`,
        }
      }
    }

    // Sum channels (dim 1) — null if any channel dim is null
    const hasNullC = validShapes.some(s => s[1] === null)
    const sumC = hasNullC ? null : validShapes.reduce((acc, s) => acc + s[1], 0)
    const outShape = [refBatch, sumC, ...refSpatial]
    return { shape: outShape, error: null }
  }

  return { error: 'UNKNOWN_MODE', shape: null, message: `Unknown merge mode: ${mode}` }
}


export function inferLayer(layerType, inputShape, config) {
  switch (layerType) {
    case 'Conv2D':   return inferConv2D(inputShape, config)
    case 'MaxPool2D': return inferMaxPool2D(inputShape, config)
    case 'Dense':    return inferDense(inputShape, config)
    case 'Flatten':  return inferFlatten(inputShape)
    case 'BatchNorm': return inferBatchNorm(inputShape)
    case 'Dropout':  return inferDropout(inputShape)
    case 'Reshape':  return inferReshape(inputShape, config)
    case 'Permute':  return inferPermute(inputShape, config)
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
  const outputOf = {}

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

    const incomingEdges = edges.filter(e => e.target === nodeId)
    const parentShapes = incomingEdges.map(e => outputOf[e.source] || null)

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
        inputShapes: parentShapes,
        inputShape: parentShapes[0] || null,
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


export function generateErrorMessage(layerType, inputShape, config, errorType) {
  if (!errorType) return null

  const shapeStr = inputShape ? formatShape(inputShape) : 'unknown'

  const messages = {
    KERNEL_TOO_LARGE:      `Kernel size too large for input ${shapeStr}. Reduce kernel size or add padding.`,
    NOT_FLATTENED:         `${layerType} received ${shapeStr}. A Flatten layer is required before Dense.`,
    NOT_FLATTENED_INPUT:   `Conv2D requires a 4D tensor. Got ${shapeStr}. Check layer ordering.`,
    NEGATIVE_DIM:          `Output dimension became negative. Input ${shapeStr} is too small for the given parameters.`,
    MISSING_INPUT:         `No input connected to this layer.`,
    INVALID_INPUT:         `Invalid input shape ${shapeStr} for ${layerType}.`,
    NO_INPUT:              `This layer has no upstream connection.`,
    SHAPE_MISMATCH:        `Shape mismatch in ${layerType}. Inputs must have compatible shapes.`,
    BATCH_MISMATCH:        `Batch size mismatch in ${layerType}.`,
    SPATIAL_MISMATCH:      `Spatial dimensions mismatch in ${layerType}.`,
    SINGLE_INPUT:          `${layerType} requires at least 2 inputs.`,
    RESHAPE_MISMATCH:      `Reshape: element count mismatch. Input and target shapes must have equal total elements.`,
    PERMUTATION_LENGTH:    `Permute: permutation length must match tensor rank.`,
    INVALID_PERMUTATION:   `Permute: permutation must be a valid reordering of dimension indices.`,
    MISSING_PERMUTATION:   `Permute: no permutation specified.`,
    INVALID_TARGET:        `Reshape: no target shape specified.`,
  }

  return messages[errorType] || `Shape error in ${layerType}: ${errorType}`
}


/**
 * Format shape array as string.
 * null dims display as 'N' (dynamic batch) or '?' (dynamic spatial).
 */
export function formatShape(shape, format = 'NCHW') {
  if (!shape) return '???'

  const fmt = (d, isBatch = false) => {
    if (d === null) return isBatch ? 'N' : '?'
    return String(d)
  }

  if (format === 'NHWC' && shape.length === 4) {
    const [b, c, h, w] = shape
    return `[${fmt(b, true)}, ${fmt(h)}, ${fmt(w)}, ${fmt(c)}]`
  }

  return `[${shape.map((d, i) => fmt(d, i === 0)).join(', ')}]`
}


export function countParams(layerType, inputShape, config) {
  if (!inputShape) return 0

  switch (layerType) {
    case 'Conv2D': {
      const inChannels = inputShape[1]
      if (inChannels === null) return 0
      const { filters = 64, kernelSize = 3 } = config
      return filters * inChannels * kernelSize * kernelSize + filters
    }
    case 'Dense': {
      const inFeatures = inputShape[inputShape.length - 1]
      if (inFeatures === null) return 0
      const { units = 256 } = config
      return inFeatures * units + units
    }
    case 'BatchNorm': {
      const channels = inputShape[1]
      if (channels === null) return 0
      return channels * 4 // basically 4 channelss were added here ->>>> gamma, beta, running_mean, running_var !
    }
    default:
      return 0
  }
}
