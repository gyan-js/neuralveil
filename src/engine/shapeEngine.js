// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Gyan Shresth
// See LICENSE file in the project root for full license text.

function safeMul(a, b)          { return (a === null || b === null) ? null : a * b }
function safeAdd(a, b)          { return (a === null || b === null) ? null : a + b }
function safeFloorDiv(n, d)     { return (n === null || d === null) ? null : Math.floor(n / d) }
function safeSub(a, b)          { return (a === null || b === null) ? null : a - b }

// ─── CONV2D ───────────────────────────────────────────────────────────────────

export function inferConv2D(inputShape, { filters, kernelSize, stride, padding, dilation = 1 }) {
  if (!inputShape || inputShape.length < 2) return { error: 'MISSING_INPUT', shape: null }

  if (inputShape.length === 2) return {
    error: 'NOT_FLATTENED_INPUT', shape: null,
    message: 'Conv2D expects a 4D tensor [B,C,H,W]. Got a 2D tensor — remove Flatten or reorder layers.',
  }

  const [batch, , H, W] = inputShape.length === 4 ? inputShape : [inputShape[0], inputShape[1], null, null]
  if (H === undefined || W === undefined) return { error: 'INVALID_SHAPE', shape: null }
  if (H === null || W === null) return { shape: [batch, filters, null, null], error: null }

  const effectiveK = dilation * (kernelSize - 1) + 1
  const outH = Math.floor((H + 2 * padding - effectiveK) / stride + 1)
  const outW = Math.floor((W + 2 * padding - effectiveK) / stride + 1)

  if (outH <= 0 || outW <= 0) {
    const suggestPad = Math.ceil((kernelSize - Math.min(H, W)) / 2) + 1
    const suggestK   = Math.max(1, (Math.min(H, W) % 2 === 0 ? Math.min(H, W) - 1 : Math.min(H, W)))
    return {
      error: 'KERNEL_TOO_LARGE', shape: null,
      message: `Conv2D: kernel [${kernelSize}×${kernelSize}] with stride ${stride} can't slide over [${H}×${W}]. ` +
        `Output would be [${outH}×${outW}]. Fix: increase padding to ≥${suggestPad}, ` +
        `reduce kernel_size to ≤${suggestK}, or add a larger feature map before this layer.`,
    }
  }
  return { shape: [batch, filters, outH, outW], error: null }
}

// ─── CONV1D ───────────────────────────────────────────────────────────────────

export function inferConv1D(inputShape, { filters, kernelSize, stride, padding, dilation = 1 }) {
  if (!inputShape || inputShape.length < 2) return { error: 'MISSING_INPUT', shape: null }

  if (inputShape.length === 2) return {
    error: 'INVALID_INPUT', shape: null,
    message: 'Conv1D expects a 3D tensor [B, C, L]. Got a 2D tensor.',
  }

  const [batch, , L] = inputShape.length === 3 ? inputShape : [inputShape[0], inputShape[1], null]
  if (L === null) return { shape: [batch, filters, null], error: null }

  const effectiveK = dilation * (kernelSize - 1) + 1
  const outL = Math.floor((L + 2 * padding - effectiveK) / stride + 1)

  if (outL <= 0) {
    return {
      error: 'KERNEL_TOO_LARGE', shape: null,
      message: `Conv1D: kernel [${kernelSize}] with stride ${stride} can't slide over length ${L}. ` +
        `Output length would be ${outL}. Reduce kernel_size or increase padding.`,
    }
  }
  return { shape: [batch, filters, outL], error: null }
}

// ─── CONV3D ───────────────────────────────────────────────────────────────────

export function inferConv3D(inputShape, { filters, kernelSize, stride, padding, dilation = 1 }) {
  if (!inputShape || inputShape.length < 4) return {
    error: 'INVALID_INPUT', shape: null,
    message: 'Conv3D expects a 5D tensor [B, C, D, H, W].',
  }

  const [batch, , D, H, W] = inputShape.length === 5
    ? inputShape
    : [inputShape[0], inputShape[1], inputShape[2], inputShape[3], null]

  const effectiveK = dilation * (kernelSize - 1) + 1
  const calc = n => n === null ? null : Math.floor((n + 2 * padding - effectiveK) / stride + 1)
  const [oD, oH, oW] = [calc(D), calc(H), calc(W)]

  if ((oD !== null && oD <= 0) || (oH !== null && oH <= 0) || (oW !== null && oW <= 0)) {
    return {
      error: 'KERNEL_TOO_LARGE', shape: null,
      message: `Conv3D: kernel [${kernelSize}] produces non-positive output dims [${oD}×${oH}×${oW}]. Reduce kernel_size or increase padding.`,
    }
  }
  return { shape: [batch, filters, oD, oH, oW], error: null }
}

// ─── CONV TRANSPOSE 2D ───────────────────────────────────────────────────────

export function inferConvTranspose2D(inputShape, { filters, kernelSize, stride, padding, outputPadding = 0 }) {
  if (!inputShape || inputShape.length !== 4) return { error: 'INVALID_INPUT', shape: null, message: 'ConvTranspose2D expects 4D input [B,C,H,W].' }
  const [batch, , H, W] = inputShape
  if (H === null || W === null) return { shape: [batch, filters, null, null], error: null }
  const outH = (H - 1) * stride - 2 * padding + kernelSize + outputPadding
  const outW = (W - 1) * stride - 2 * padding + kernelSize + outputPadding
  return { shape: [batch, filters, outH, outW], error: null }
}

// ─── MAXPOOL2D ────────────────────────────────────────────────────────────────

export function inferMaxPool2D(inputShape, { kernelSize, stride, padding = 0 }) {
  if (!inputShape || inputShape.length !== 4) return { error: 'INVALID_INPUT', shape: null, message: 'MaxPool2D expects a 4D tensor [B,C,H,W].' }
  const [batch, channels, H, W] = inputShape
  if (H === null || W === null) return { shape: [batch, channels, null, null], error: null }
  const outH = Math.floor((H + 2 * padding - kernelSize) / stride + 1)
  const outW = Math.floor((W + 2 * padding - kernelSize) / stride + 1)
  if (outH <= 0 || outW <= 0) {
    return {
      error: 'KERNEL_TOO_LARGE', shape: null,
      message: `MaxPool2D: kernel [${kernelSize}×${kernelSize}] stride ${stride} can't reduce [${H}×${W}]. ` +
        `Fix: reduce kernel_size to ≤${Math.max(2, Math.min(H, W))}, or add padding.`,
    }
  }
  return { shape: [batch, channels, outH, outW], error: null }
}

// ─── AVGPOOL2D ────────────────────────────────────────────────────────────────

export function inferAvgPool2D(inputShape, { kernelSize, stride, padding = 0 }) {

  return inferMaxPool2D(inputShape, { kernelSize, stride, padding })
}

// ─── ADAPTIVE AVGPOOL ─────────────────────────────────────────────────────────

export function inferAdaptiveAvgPool(inputShape, { outputSize }) {
  if (!inputShape || inputShape.length !== 4) return { error: 'INVALID_INPUT', shape: null, message: 'AdaptiveAvgPool expects 4D input [B,C,H,W].' }
  const [batch, channels] = inputShape
  const sz = outputSize ?? 1
  return { shape: [batch, channels, sz, sz], error: null }
}

// ─── GLOBAL AVG POOL ─────────────────────────────────────────────────────────

export function inferGlobalAvgPool(inputShape) {
  if (!inputShape || inputShape.length < 2) return { error: 'MISSING_INPUT', shape: null }
  const [batch, channels] = inputShape
  // Collapses spatial dims → [B, C]
  return { shape: [batch, channels], error: null }
}

// ─── UPSAMPLE ─────────────────────────────────────────────────────────────────

export function inferUpsample(inputShape, { scaleFactor = 2 }) {
  if (!inputShape || inputShape.length !== 4) return { error: 'INVALID_INPUT', shape: null, message: 'Upsample expects 4D input [B,C,H,W].' }
  const [batch, channels, H, W] = inputShape
  const outH = H === null ? null : Math.round(H * scaleFactor)
  const outW = W === null ? null : Math.round(W * scaleFactor)
  return { shape: [batch, channels, outH, outW], error: null }
}

// ─── ZEROPAD2D ────────────────────────────────────────────────────────────────

export function inferZeroPad2D(inputShape, { padding = 1 }) {
  if (!inputShape || inputShape.length !== 4) return { error: 'INVALID_INPUT', shape: null, message: 'ZeroPad2D expects 4D input [B,C,H,W].' }
  const [batch, channels, H, W] = inputShape
  const outH = H === null ? null : H + 2 * padding
  const outW = W === null ? null : W + 2 * padding
  return { shape: [batch, channels, outH, outW], error: null }
}


export function inferDense(inputShape, { units, inFeatures }) {
  if (!inputShape || inputShape.length === 0) return { error: 'MISSING_INPUT', shape: null }

  const inF = inputShape[inputShape.length - 1]
  const outputShape = [...inputShape.slice(0, -1), units]

 
  if (inFeatures != null && inF !== null && inF !== inFeatures) {
    return {
      shape: outputShape,
      error: 'FEATURE_MISMATCH',
      warning: true,
      message: `Dense in_features mismatch: layer expects ${inFeatures}, got ${inF}. ` +
        `Output shape propagated as ${formatShape(outputShape)}.`,
    }
  }

  return { shape: outputShape, error: null }
}

// ─── FLATTEN ──────────────────────────────────────────────────────────────────

export function inferFlatten(inputShape, config = {}) {
  if (!inputShape) return { error: 'MISSING_INPUT', shape: null }
  const startDim = config.startDim ?? 1
  if (startDim !== 1) {
    // Partial flatten: keep dims 0..startDim-1, collapse rest
    const kept = inputShape.slice(0, startDim)
    const rest = inputShape.slice(startDim)
    const hasNull = rest.some(d => d === null)
    const flat = hasNull ? null : rest.reduce((a, b) => a * b, 1)
    return { shape: [...kept, flat], error: null }
  }
  const [batch, ...rest] = inputShape
  const hasNull = rest.some(d => d === null)
  const flat = hasNull ? null : rest.reduce((a, b) => a * b, 1)
  return { shape: [batch, flat], error: null }
}

// ─── BATCH NORM ───────────────────────────────────────────────────────────────

export function inferBatchNorm(inputShape) {
  if (!inputShape) return { error: 'MISSING_INPUT', shape: null }
  return { shape: [...inputShape], error: null }
}

// ─── GROUP NORM ───────────────────────────────────────────────────────────────

export function inferGroupNorm(inputShape) {
  if (!inputShape) return { error: 'MISSING_INPUT', shape: null }
  return { shape: [...inputShape], error: null }
}

// ─── DROPOUT ──────────────────────────────────────────────────────────────────

export function inferDropout(inputShape) {
  if (!inputShape) return { error: 'MISSING_INPUT', shape: null }
  return { shape: [...inputShape], error: null }
}

// ─── RESHAPE ──────────────────────────────────────────────────────────────────

export function inferReshape(inputShape, config) {
  if (!inputShape) return { error: 'MISSING_INPUT', shape: null }

  // Handle special reshape ops from tracer
  if (config._unsqueeze) {
    const dim = config.dim ?? -1
    const out = [...inputShape]
    const insertAt = dim < 0 ? out.length + dim + 1 : dim
    out.splice(insertAt, 0, 1)
    return { shape: out, error: null }
  }

  if (config._squeeze) {
    const dim = config.dim
    if (dim !== null && dim !== undefined) {
      const out = [...inputShape]
      if (out[dim] === 1) out.splice(dim, 1)
      return { shape: out, error: null }
    }
    return { shape: inputShape.filter(d => d !== 1), error: null }
  }

  if (config._reduce) {
    const dim = config.dim
    const keepdim = config.keepdim ?? false
    if (dim !== null && dim !== undefined) {
      const out = [...inputShape]
      if (keepdim) { out[dim] = 1 } else { out.splice(dim, 1) }
      return { shape: out, error: null }
    }
    return { shape: [inputShape[0]], error: null }
  }

  
  const { targetC, targetH, targetW } = config
  const [batch, ...rest] = inputShape
  const inProduct = rest.every(d => d !== null) ? rest.reduce((a, b) => a * b, 1) : null
  const outDims = [targetC, targetH, targetW].filter(d => d !== undefined && d !== null)

  if (outDims.length === 0) return { error: 'INVALID_TARGET', shape: null, message: 'Reshape: specify at least one target dimension.' }

  const outProduct = outDims.reduce((a, b) => a * b, 1)
  if (inProduct !== null && outProduct !== inProduct) {
    return {
      error: 'RESHAPE_MISMATCH', shape: null,
      message: `Reshape: input has ${inProduct} elements but target has ${outProduct}. ` +
        `They must be equal. Input dims: [${rest.join('×')}] = ${inProduct}.`,
    }
  }

  const outShape = [batch, targetC]
  if (targetH !== undefined && targetH !== null) outShape.push(targetH)
  if (targetW !== undefined && targetW !== null) outShape.push(targetW)
  return { shape: outShape, error: null }
}

// ─── PERMUTE ──────────────────────────────────────────────────────────────────

export function inferPermute(inputShape, { permutation, _transpose, dims }) {
  if (!inputShape) return { error: 'MISSING_INPUT', shape: null }

  // transpose(a, b) variant
  if (_transpose && dims) {
    const out = [...inputShape]
    const [da, db] = dims
    ;[out[da], out[db]] = [out[db], out[da]]
    return { shape: out, error: null }
  }

  if (!permutation || !Array.isArray(permutation)) return { error: 'MISSING_PERMUTATION', shape: null, message: 'Permute: provide a permutation array.' }

  const rank = inputShape.length
  if (permutation.length !== rank) {
    return {
      error: 'PERMUTATION_LENGTH', shape: null,
      message: `Permute: input is ${rank}D but permutation has ${permutation.length} entries. ` +
        `Fix: change permutation to have exactly ${rank} entries (0-indexed).`,
    }
  }

  const sorted = [...permutation].sort((a, b) => a - b)
  for (let i = 0; i < rank; i++) {
    if (sorted[i] !== i) return {
      error: 'INVALID_PERMUTATION', shape: null,
      message: `[${permutation.join(',')}] is not a valid permutation of [0..${rank - 1}].`,
    }
  }

  return { shape: permutation.map(i => inputShape[i]), error: null }
}



export function inferMultiHeadAttention(inputShape, { embed_dim, num_heads }) {
  if (!inputShape) return { error: 'MISSING_INPUT', shape: null }

  if (inputShape.length !== 3) return {
    error: 'INVALID_INPUT', shape: null,
    message: `MultiHeadAttention expects 3D tensor [B, seq_len, embed_dim]. Got ${formatShape(inputShape)}. ` +
      `For CNN features, add Flatten then reshape to [B, seq_len, embed_dim].`,
  }

  if (!embed_dim || embed_dim < 1) return { error: 'INVALID_EMBED_DIM', shape: null, message: 'MultiHeadAttention: embed_dim must be ≥ 1.' }
  if (!num_heads || num_heads < 1) return { error: 'INVALID_NUM_HEADS', shape: null, message: 'MultiHeadAttention: num_heads must be ≥ 1.' }

  if (embed_dim % num_heads !== 0) return {
    error: 'HEAD_DIM_MISMATCH', shape: null,
    message: `MultiHeadAttention: embed_dim (${embed_dim}) must be divisible by num_heads (${num_heads}). ` +
      `Fix: set embed_dim to ${num_heads * Math.round(embed_dim / num_heads)} or ` +
      `num_heads to ${[1, 2, 4, 8, 16].filter(n => embed_dim % n === 0).pop() ?? 1}.`,
  }

  const [batch, seqLen] = inputShape
  return { shape: [batch, seqLen, embed_dim], error: null }
}

// ─── LSTM ────────────────────────────────────────────────────────────────────

export function inferLSTM(inputShape, { hidden_size, bidirectional = false, return_sequences = true }) {
  if (!inputShape) return { error: 'MISSING_INPUT', shape: null }

  if (inputShape.length !== 3) return {
    error: 'INVALID_INPUT', shape: null,
    message: `LSTM expects 3D input [B, seq_len, input_size]. Got ${formatShape(inputShape)}. ` +
      `For image features, flatten spatial dims to a sequence first.`,
  }

  if (!hidden_size || hidden_size < 1) return { error: 'INVALID_HIDDEN', shape: null, message: 'LSTM: hidden_size must be ≥ 1.' }

  const [batch, seqLen] = inputShape
  const outFeatures = bidirectional ? hidden_size * 2 : hidden_size

  if (return_sequences) {
    return { shape: [batch, seqLen, outFeatures], error: null }
  }
  // Last timestep only → 2D
  return { shape: [batch, outFeatures], error: null }
}

// ─── GRU ─────────────────────────────────────────────────────────────────────

export function inferGRU(inputShape, config) {
  // GRU and LSTM have identical shape semantics
  return inferLSTM(inputShape, config)
}

// ─── EMBEDDING ────────────────────────────────────────────────────────────────

export function inferEmbedding(inputShape, { num_embeddings, embedding_dim }) {
  if (!inputShape) return { error: 'MISSING_INPUT', shape: null }
  
  const [batch, seqLen] = inputShape
  return { shape: [batch, seqLen, embedding_dim], error: null }
}

// ─── LAYER NORM ───────────────────────────────────────────────────────────────

export function inferLayerNorm(inputShape) {
  if (!inputShape) return { error: 'MISSING_INPUT', shape: null }
  return { shape: [...inputShape], error: null }
}

// ─── MERGE ────────────────────────────────────────────────────────────────────

export function inferMerge(inputShapes, mode) {
  const valids = inputShapes.filter(Boolean)
  if (valids.length < 2) return {
    error: 'SINGLE_INPUT', shape: null,
    message: `Merge requires at least 2 connected inputs. Currently has ${valids.length}. Connect the second branch.`,
  }

  const [a, b] = valids
  if (a.length !== b.length) return {
    error: 'RANK_MISMATCH', shape: null,
    message: `Merge: inputs have different ranks (${a.length}D vs ${b.length}D). All inputs must have the same number of dimensions.`,
  }

  if (mode === 'add') {
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== null && b[i] !== null && a[i] !== b[i]) return {
        error: 'SHAPE_MISMATCH', shape: null,
        message: `Merge (ADD): dim ${i} mismatch — ${a[i]} ≠ ${b[i]}. Shapes must be identical for element-wise addition. ` +
          `Check that both branches have the same filters/units.`,
      }
    }
    return { shape: a.map((d, i) => (d === null || b[i] === null) ? null : d), error: null }
  }

  
  const concatDim = a.length === 4 ? 1 : a.length - 1
  for (let i = 0; i < a.length; i++) {
    if (i === concatDim) continue
    if (a[i] !== null && b[i] !== null && a[i] !== b[i]) return {
      error: 'SPATIAL_MISMATCH', shape: null,
      message: `Merge (CONCAT): non-channel dim ${i} mismatch — ${a[i]} ≠ ${b[i]}. ` +
        `Batch and spatial dims must match; only the channel dim is summed.`,
    }
  }
  const outShape = [...a]
  outShape[concatDim] = (a[concatDim] === null || b[concatDim] === null)
    ? null
    : safeAdd(a[concatDim], b[concatDim])
  return { shape: outShape, error: null }
}


export function inferLayer(layerType, inputShape, config) {
  switch (layerType) {
    case 'Conv2D':             return inferConv2D(inputShape, config)
    case 'Conv1D':             return inferConv1D(inputShape, config)
    case 'Conv3D':             return inferConv3D(inputShape, config)
    case 'ConvTranspose2D':    return inferConvTranspose2D(inputShape, config)
    case 'MaxPool2D':          return inferMaxPool2D(inputShape, config)
    case 'AvgPool2D':          return inferAvgPool2D(inputShape, config)
    case 'AdaptiveAvgPool':    return inferAdaptiveAvgPool(inputShape, config)
    case 'GlobalAvgPool':      return inferGlobalAvgPool(inputShape)
    case 'Upsample':           return inferUpsample(inputShape, config)
    case 'ZeroPad2D':          return inferZeroPad2D(inputShape, config)
    case 'Dense':              return inferDense(inputShape, config)
    case 'Flatten':            return inferFlatten(inputShape, config)
    case 'BatchNorm':          return inferBatchNorm(inputShape)
    case 'GroupNorm':          return inferGroupNorm(inputShape)
    case 'Dropout':            return inferDropout(inputShape)
    case 'Reshape':            return inferReshape(inputShape, config)
    case 'Permute':            return inferPermute(inputShape, config)
    case 'MultiHeadAttention': return inferMultiHeadAttention(inputShape, config)
    case 'LSTM':               return inferLSTM(inputShape, config)
    case 'GRU':                return inferGRU(inputShape, config)
    case 'Embedding':          return inferEmbedding(inputShape, config)
    case 'LayerNorm':          return inferLayerNorm(inputShape)
    case 'Unknown':            return { shape: inputShape, error: null } // passthrough
   
    default:                   return { shape: inputShape, error: null }
  }
}

export function topoSort(nodes, edges) {
  const adj = {}, inDegree = {}
  for (const n of nodes) { adj[n.id] = []; inDegree[n.id] = 0 }
  for (const e of edges) {
    if (adj[e.source] !== undefined) adj[e.source].push(e.target)
    if (inDegree[e.target] !== undefined) inDegree[e.target]++
  }
  const queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id)
  const sorted = []
  while (queue.length > 0) {
    const curr = queue.shift()
    sorted.push(curr)
    for (const nb of (adj[curr] || [])) {
      inDegree[nb]--
      if (inDegree[nb] === 0) queue.push(nb)
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
    results[inputNode.id] = { inputShape: null, outputShape: inputShape, error: null, message: null }
  }

  for (const nodeId of sorted) {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) continue
    const lt = node.data?.layerType ?? node.type
    if (lt === 'Input') continue

    const incomingEdges = edges.filter(e => e.target === nodeId)
    const parentShapes = incomingEdges.map(e => outputOf[e.source] || null)


    if (lt === 'Merge') {
      const mode = node.data?.config?.mode || node.config?.mode || 'add'
      
      if (mode === 'branch') {
        const firstShape = parentShapes.find(Boolean) ?? null
        results[nodeId] = { inputShapes: parentShapes, inputShape: firstShape, outputShape: firstShape, error: null, message: null }
        outputOf[nodeId] = firstShape
        continue
      }
      if (incomingEdges.length === 0) {
        results[nodeId] = { inputShapes: [], inputShape: null, outputShape: null, error: 'NO_INPUT', message: 'No connected inputs. Connect this layer to upstream layers.' }
        outputOf[nodeId] = null
        continue
      }
      const { shape, error, message } = inferMerge(parentShapes, mode)
      results[nodeId] = { inputShapes: parentShapes, inputShape: parentShapes[0] || null, outputShape: shape, error, message }
      outputOf[nodeId] = shape
      continue
    }

    // ── Single-input layers ──
    let inShape = null
    if (incomingEdges.length > 0) {
      inShape = outputOf[incomingEdges[0].source] || null
    }

    if (!inShape) {
      results[nodeId] = { inputShape: null, outputShape: null, error: 'NO_INPUT', message: 'No connected input. Connect this layer to an upstream layer.' }
      continue
    }

    const config = node.data?.config ?? node.config ?? {}
    const { shape, error, warning, message } = inferLayer(lt, inShape, config)

    results[nodeId] = {
      inputShape: inShape,
      outputShape: shape,
    
      error: (error && !shape) ? error : null,
      warning: warning ?? (error && !!shape ? error : null),
      message: message || generateErrorMessage(lt, inShape, config, error),
    }
   
    outputOf[nodeId] = shape
  }

  return results
}


export function generateErrorMessage(layerType, inputShape, config, errorType) {
  if (!errorType) return null
  const shapeStr = inputShape ? formatShape(inputShape) : 'unknown'

  const messages = {
    KERNEL_TOO_LARGE:      `Kernel too large for input ${shapeStr}. Reduce kernel_size or increase padding.`,
  
    NOT_FLATTENED_INPUT:   `Conv2D/Conv3D requires a spatial tensor. Got ${shapeStr}.`,
    FEATURE_MISMATCH:      `Dense in_features mismatch at input ${shapeStr}. Output shape propagated with target units.`,
    NEGATIVE_DIM:          `Output dimension became negative. Input ${shapeStr} is too small for these parameters.`,
    MISSING_INPUT:         `No input connected to this layer.`,
    INVALID_INPUT:         `Invalid input shape ${shapeStr} for ${layerType}.`,
    NO_INPUT:              `This layer has no upstream connection.`,
    SHAPE_MISMATCH:        `Shape mismatch in ${layerType}. Inputs must have compatible shapes.`,
    RANK_MISMATCH:         `Rank mismatch in Merge — inputs have different numbers of dimensions.`,
    BATCH_MISMATCH:        `Batch size mismatch in ${layerType}.`,
    SPATIAL_MISMATCH:      `Spatial dimension mismatch in ${layerType}.`,
    SINGLE_INPUT:          `${layerType} requires at least 2 inputs.`,
    RESHAPE_MISMATCH:      `Reshape element count mismatch. Input and target shapes must have equal total elements.`,
    PERMUTATION_LENGTH:    `Permute: permutation length must match tensor rank (${inputShape?.length ?? '?'}).`,
    INVALID_PERMUTATION:   `Permute: permutation must be a valid reordering of dimension indices.`,
    MISSING_PERMUTATION:   `Permute: no permutation specified.`,
    INVALID_EMBED_DIM:     `embed_dim must be a positive integer.`,
    INVALID_NUM_HEADS:     `num_heads must be a positive integer.`,
    INVALID_HIDDEN:        `hidden_size must be a positive integer.`,
    HEAD_DIM_MISMATCH:     `embed_dim must be divisible by num_heads.`,
    INVALID_TARGET:        `Reshape: no target shape specified.`,
  }

  return messages[errorType] || `Shape error in ${layerType}: ${errorType}`
}


export function formatShape(shape, format = 'NCHW') {
  if (!shape) return '???'
  const fmt = (d, isBatch = false) => d === null ? (isBatch ? 'N' : '?') : String(d)

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
      const inC = inputShape[1]
      if (inC === null) return 0
      const { filters = 64, kernelSize = 3 } = config
      return filters * inC * kernelSize * kernelSize + filters
    }
    case 'Conv1D': {
      const inC = inputShape[1]
      if (inC === null) return 0
      const { filters = 64, kernelSize = 3 } = config
      return filters * inC * kernelSize + filters
    }
    case 'Conv3D': {
      const inC = inputShape[1]
      if (inC === null) return 0
      const { filters = 64, kernelSize = 3 } = config
      return filters * inC * kernelSize * kernelSize * kernelSize + filters
    }
    case 'ConvTranspose2D': {
      const inC = inputShape[1]
      if (inC === null) return 0
      const { filters = 64, kernelSize = 2 } = config
      return inC * filters * kernelSize * kernelSize + filters
    }
    case 'Dense': {
      const inF = inputShape[inputShape.length - 1]
      if (inF === null) return 0
      const { units = 256 } = config
      return inF * units + units
    }
    case 'BatchNorm': {
      const channels = inputShape[1] ?? inputShape[inputShape.length - 1]
      if (channels === null) return 0
      return channels * 4 // gamma, beta, running_mean, running_var
    }
    case 'GroupNorm': {
      const channels = inputShape[1]
      if (channels === null) return 0
      return channels * 2 // gamma + beta
    }
    case 'LayerNorm': {
      const lastDim = inputShape[inputShape.length - 1]
      if (lastDim === null) return 0
      return lastDim * 2
    }
    case 'MultiHeadAttention': {
      const { embed_dim = 512 } = config
      return 4 * embed_dim * embed_dim + 4 * embed_dim
    }
    case 'LSTM':
    case 'GRU': {
      const input_size = inputShape[2]
      if (input_size === null || input_size === undefined) return 0
      const { hidden_size = 256, bidirectional = false, num_layers = 1 } = config
      const gatesPerCell = layerType === 'LSTM' ? 4 : 3
      let total = 0
      for (let l = 0; l < (num_layers || 1); l++) {
        const in_size = l === 0 ? input_size : (bidirectional ? hidden_size * 2 : hidden_size)
        const layer_params = gatesPerCell * ((in_size + hidden_size) * hidden_size + hidden_size)
        total += bidirectional ? layer_params * 2 : layer_params
      }
      return total
    }
    case 'Embedding': {
      const { num_embeddings = 10000, embedding_dim = 256 } = config
      return num_embeddings * embedding_dim
    }
    default:
      return 0
  }
}