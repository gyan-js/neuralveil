import { propagateGraph, formatShape } from './shapeEngine.js'




function topoSortIds(nodes, edges) {
  const adj = {}
  const inDegree = {}

  for (const n of nodes) {
    adj[n.id] = []
    inDegree[n.id] = 0
  }

  for (const e of edges) {
    if (adj[e.source]) adj[e.source].push(e.target)
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


// ─── PYTORCH EXPORT ───────────────────────────────────────────────────────────

export function exportToPyTorch(nodes, edges, inputShape) {
  const sorted = topoSortIds(nodes, edges)
  const results = propagateGraph(nodes, edges, inputShape)

  const inputNode = nodes.find(n => n.data?.layerType === 'Input')
  const nonInputNodes = sorted
    .map(id => nodes.find(n => n.id === id))
    .filter(n => n && n.data?.layerType !== 'Input')

  const layerCounters = {}
  const getLayerName = (type) => {
    const key = type.toLowerCase()
    layerCounters[key] = (layerCounters[key] || 0) + 1
    const suffix = layerCounters[key]
    const names = {
      conv2d:             `conv${suffix}`,
      maxpool2d:          `pool${suffix}`,
      dense:              `fc${suffix}`,
      flatten:            `flatten`,
      batchnorm:          `bn${suffix}`,
      dropout:            `dropout${suffix === 1 ? '' : suffix}`,
      merge:              `merge${suffix}`,
      reshape:            `reshape${suffix}`,
      permute:            `permute${suffix}`,
      multiheadattention: `attn${suffix}`,
      lstm:               `lstm${suffix}`,
      embedding:          `embed${suffix}`,
      layernorm:          `ln${suffix}`,
    }
    return names[key] || `layer${suffix}`
  }

  const varNameMap = {}
  const inputNodeId = inputNode?.id
  if (inputNodeId) varNameMap[inputNodeId] = 'x'

  const layerNameMap = {}
  const initLines = []
  const forwardLines = []

  for (const node of nonInputNodes) {
    const type = node.data?.layerType
    const cfg = node.data?.config || {}
    const name = getLayerName(type)
    layerNameMap[node.id] = name

    const inEdges = edges.filter(e => e.target === node.id)
    const sourceId = inEdges[0]?.source
    const inResult = sourceId ? results[sourceId] : null
    const inShape = inResult?.outputShape || null

    const outVar = name.replace(/\d+$/, '') + (layerCounters[type.toLowerCase()] || 1)
    varNameMap[node.id] = outVar

    let initLine = ''
    let forwardLine = ''

    switch (type) {
      case 'Conv2D': {
        const inC = inShape?.[1] ?? '???'
        const { filters = 64, kernelSize = 3, stride = 1, padding = 0 } = cfg
        initLine = `        self.${name} = nn.Conv2d(in_channels=${inC}, out_channels=${filters}, kernel_size=${kernelSize}, stride=${stride}, padding=${padding})`
        forwardLine = `        ${outVar} = torch.relu(self.${name}(${varNameMap[sourceId] || 'x'}))`
        break
      }
      case 'MaxPool2D': {
        const { kernelSize = 2, stride = 2 } = cfg
        initLine = `        self.${name} = nn.MaxPool2d(kernel_size=${kernelSize}, stride=${stride})`
        forwardLine = `        ${outVar} = self.${name}(${varNameMap[sourceId] || 'x'})`
        break
      }
      case 'Dense': {
        const inF = inShape?.[1] ?? '???'
        const { units = 256 } = cfg
        const isLast = nonInputNodes.indexOf(node) === nonInputNodes.length - 1
        initLine = `        self.${name} = nn.Linear(in_features=${inF}, out_features=${units})`
        forwardLine = isLast
          ? `        ${outVar} = self.${name}(${varNameMap[sourceId] || 'x'})`
          : `        ${outVar} = torch.relu(self.${name}(${varNameMap[sourceId] || 'x'}))`
        break
      }
      case 'Flatten': {
        initLine = `        self.${name} = nn.Flatten()`
        forwardLine = `        ${outVar} = self.${name}(${varNameMap[sourceId] || 'x'})`
        break
      }
      case 'BatchNorm': {
        const channels = inShape?.[1] ?? '???'
        initLine = `        self.${name} = nn.BatchNorm2d(num_features=${channels})`
        forwardLine = `        ${outVar} = self.${name}(${varNameMap[sourceId] || 'x'})`
        break
      }
      case 'Dropout': {
        const { p = 0.5 } = cfg
        initLine = `        self.${name} = nn.Dropout(p=${p})`
        forwardLine = `        ${outVar} = self.${name}(${varNameMap[sourceId] || 'x'})`
        break
      }
      case 'Merge': {
        const mode = cfg.mode || 'add'
        const parentVars = inEdges.map(e => varNameMap[e.source]).filter(Boolean)
        const tensorsStr = parentVars.join(', ')
        if (mode === 'add') {
          forwardLine = `        ${outVar} = ${parentVars.join(' + ')}  # residual / skip ADD`
        } else {
          forwardLine = `        ${outVar} = torch.cat([${tensorsStr}], dim=1)  # skip CONCAT`
        }
        break
      }
      case 'Reshape': {
        const { targetC, targetH, targetW } = cfg
        const dims = [targetC, targetH, targetW].filter(d => d !== undefined && d !== null)
        const dimsStr = dims.join(', ')
        forwardLine = `        ${outVar} = ${varNameMap[sourceId] || 'x'}.view(${varNameMap[sourceId] || 'x'}.size(0), ${dimsStr})  # reshape`
        break
      }
      case 'Permute': {
        const { permutation = [0, 1, 2, 3] } = cfg
        const permStr = permutation.join(', ')
        forwardLine = `        ${outVar} = ${varNameMap[sourceId] || 'x'}.permute(${permStr}).contiguous()  # permute`
        break
      }
      case 'MultiHeadAttention': {
        const { embed_dim = 512, num_heads = 8, dropout = 0.1 } = cfg
        initLine = `        self.${name} = nn.MultiheadAttention(embed_dim=${embed_dim}, num_heads=${num_heads}, dropout=${dropout}, batch_first=True)`
        const src = varNameMap[sourceId] || 'x'
        forwardLine = `        ${outVar}, _ = self.${name}(${src}, ${src}, ${src})  # self-attention`
        break
      }
      case 'LSTM': {
        const input_size = inShape?.[2] ?? '???'
        const { hidden_size = 256, num_layers = 1, bidirectional = false, return_sequences = true } = cfg
        initLine = `        self.${name} = nn.LSTM(input_size=${input_size}, hidden_size=${hidden_size}, num_layers=${num_layers}, batch_first=True, bidirectional=${bidirectional ? 'True' : 'False'})`
        const src = varNameMap[sourceId] || 'x'
        if (return_sequences) {
          forwardLine = `        ${outVar}, _ = self.${name}(${src})  # (B, seq_len, hidden${bidirectional ? '*2' : ''})`
        } else {
          forwardLine = `        ${outVar}_seq, _ = self.${name}(${src})\n        ${outVar} = ${outVar}_seq[:, -1, :]  # last timestep only`
        }
        break
      }
      case 'Embedding': {
        const { num_embeddings = 10000, embedding_dim = 256 } = cfg
        initLine = `        self.${name} = nn.Embedding(num_embeddings=${num_embeddings}, embedding_dim=${embedding_dim})`
        forwardLine = `        ${outVar} = self.${name}(${varNameMap[sourceId] || 'x'})  # (B, seq_len, embed_dim)`
        break
      }
      case 'LayerNorm': {
        const normalized_shape = inShape ? inShape.slice(1) : ['???']
        initLine = `        self.${name} = nn.LayerNorm(normalized_shape=[${normalized_shape.join(', ')}])`
        forwardLine = `        ${outVar} = self.${name}(${varNameMap[sourceId] || 'x'})`
        break
      }
    }

    if (initLine) initLines.push(initLine)
    if (forwardLine) forwardLines.push(forwardLine)
  }

  const [b, c, h, w] = inputShape
  const batchCode = (b === null || b === undefined) ? 2 : b === 1 ? 1 : b

  const code = `import torch
import torch.nn as nn


class GeneratedModel(nn.Module):
    def __init__(self):
        super().__init__()
${initLines.length > 0 ? initLines.join('\n') : '        pass'}

    def forward(self, x):
${forwardLines.join('\n')}
        return ${varNameMap[nonInputNodes[nonInputNodes.length - 1]?.id] || 'x'}


if __name__ == '__main__':
    model = GeneratedModel()
    print(model)
    x = torch.randn(${batchCode}, ${c ?? '???'}, ${h ?? '???'}, ${w ?? '???'})
    out = model(x)
    print(f"Output shape: {out.shape}")
`
  return code
}




export function exportToKeras(nodes, edges, inputShape) {
  const sorted = topoSortIds(nodes, edges)
  const results = propagateGraph(nodes, edges, inputShape)

  const inputNode = nodes.find(n => n.data?.layerType === 'Input')
  const nonInputNodes = sorted
    .map(id => nodes.find(n => n.id === id))
    .filter(n => n && n.data?.layerType !== 'Input')

  // Track whether the graph has branches (Merge nodes) — if so, use functional API
  const hasMerge = nonInputNodes.some(n => n.data?.layerType === 'Merge')

  const layerCounters = {}
  const getVarName = (type) => {
    const key = type.toLowerCase().replace(/2d/g, '2d')
    layerCounters[key] = (layerCounters[key] || 0) + 1
    const s = layerCounters[key]
    const map = {
      conv2d:             `x${s}`,
      maxpool2d:          `p${s}`,
      dense:              `d${s}`,
      flatten:            `flat`,
      batchnorm:          `bn${s}`,
      dropout:            `drop${s}`,
      merge:              `merged${s}`,
      reshape:            `rs${s}`,
      permute:            `perm${s}`,
      multiheadattention: `attn${s}`,
      lstm:               `lstm${s}`,
      embedding:          `emb${s}`,
      layernorm:          `ln${s}`,
    }
    return map[key] || `layer${s}`
  }

  const tensorVarOf = {}
  const inputNodeId = inputNode?.id
  if (inputNodeId) tensorVarOf[inputNodeId] = 'inputs'

  const lines = []  

  for (const node of nonInputNodes) {
    const type = node.data?.layerType
    const cfg = node.data?.config || {}
    const varName = getVarName(type)

    const inEdges = edges.filter(e => e.target === node.id)
    const sourceId = inEdges[0]?.source
    const inResult = sourceId ? results[sourceId] : null
    const inShape = inResult?.outputShape || null
    const srcVar = tensorVarOf[sourceId] || 'inputs'

    tensorVarOf[node.id] = varName

    switch (type) {
      case 'Conv2D': {
        const { filters = 64, kernelSize = 3, stride = 1, padding = 1 } = cfg
        const pad = padding > 0 ? 'same' : 'valid'
        lines.push(`${varName} = layers.Conv2D(${filters}, kernel_size=${kernelSize}, strides=${stride}, padding='${pad}', activation='relu')(${srcVar})`)
        break
      }
      case 'MaxPool2D': {
        const { kernelSize = 2, stride = 2 } = cfg
        lines.push(`${varName} = layers.MaxPooling2D(pool_size=${kernelSize}, strides=${stride})(${srcVar})`)
        break
      }
      case 'Dense': {
        const { units = 256 } = cfg
        const isLast = nonInputNodes.indexOf(node) === nonInputNodes.length - 1
        const act = isLast ? '' : ", activation='relu'"
        lines.push(`${varName} = layers.Dense(${units}${act})(${srcVar})`)
        break
      }
      case 'Flatten': {
        lines.push(`${varName} = layers.Flatten()(${srcVar})`)
        break
      }
      case 'BatchNorm': {
        lines.push(`${varName} = layers.BatchNormalization()(${srcVar})`)
        break
      }
      case 'Dropout': {
        const { p = 0.5 } = cfg
        lines.push(`${varName} = layers.Dropout(${p})(${srcVar})`)
        break
      }
      case 'Merge': {
        const mode = cfg.mode || 'add'
        const parentVars = inEdges.map(e => tensorVarOf[e.source]).filter(Boolean)
        if (mode === 'add') {
          lines.push(`${varName} = layers.Add()([${parentVars.join(', ')}])  # residual ADD`)
        } else {
          lines.push(`${varName} = layers.Concatenate(axis=-1)([${parentVars.join(', ')}])  # CONCAT`)
        }
        break
      }
      case 'Reshape': {
        const { targetC, targetH, targetW } = cfg
        const dims = [targetC, targetH, targetW].filter(d => d !== undefined && d !== null)
        lines.push(`${varName} = layers.Reshape((${dims.join(', ')},))(${srcVar})`)
        break
      }
      case 'Permute': {
        // Keras Permute is 1-indexed and excludes batch
        const { permutation = [0, 1, 2, 3] } = cfg
        const kerasPerm = permutation.slice(1).map(d => d)  // drop batch dim
        lines.push(`${varName} = layers.Permute((${kerasPerm.join(', ')},))(${srcVar})  # excludes batch`)
        break
      }
      case 'MultiHeadAttention': {
        const { embed_dim = 512, num_heads = 8, dropout = 0.1 } = cfg
        lines.push(`${varName} = layers.MultiHeadAttention(num_heads=${num_heads}, key_dim=${Math.floor(embed_dim / num_heads)}, dropout=${dropout})(${srcVar}, ${srcVar})`)
        break
      }
      case 'LSTM': {
        const { hidden_size = 256, num_layers = 1, bidirectional = false, return_sequences = true } = cfg
        const lstmLayer = `layers.LSTM(${hidden_size}, return_sequences=${return_sequences ? 'True' : 'False'})`
        if (bidirectional) {
          lines.push(`${varName} = layers.Bidirectional(${lstmLayer})(${srcVar})`)
        } else {
          lines.push(`${varName} = ${lstmLayer}(${srcVar})`)
        }
        if (num_layers > 1) {
          lines.push(`# Note: add ${num_layers - 1} more LSTM layer(s) for num_layers=${num_layers}`)
        }
        break
      }
      case 'Embedding': {
        const { num_embeddings = 10000, embedding_dim = 256 } = cfg
        lines.push(`${varName} = layers.Embedding(input_dim=${num_embeddings}, output_dim=${embedding_dim})(${srcVar})`)
        break
      }
      case 'LayerNorm': {
        lines.push(`${varName} = layers.LayerNormalization()(${srcVar})`)
        break
      }
      default:
        lines.push(`# ${type} — not yet mapped to Keras`)
    }
  }

  const [b, c, h, w] = inputShape
 
  const inputSpecItems = [b === null ? 'None' : b, h ?? '???', w ?? '???', c ?? '???']
  const batchSize = b === null ? 'None' : b

  const lastVar = tensorVarOf[nonInputNodes[nonInputNodes.length - 1]?.id] || 'inputs'

  const code = `import tensorflow as tf
from tensorflow.keras import layers, Model


# Build model using the Keras Functional API
inputs = tf.keras.Input(shape=(${h ?? '???'}, ${w ?? '???'}, ${c ?? '???'}))  # HWC (channels-last)

${lines.join('\n')}

model = Model(inputs=inputs, outputs=${lastVar})
model.summary()

if __name__ == '__main__':
    import numpy as np
    x = np.random.randn(${batchSize ?? 1}, ${h ?? '???'}, ${w ?? '???'}, ${c ?? '???'}).astype('float32')
    out = model.predict(x)
    print(f"Output shape: {out.shape}")
`
  return code
}




export function exportToJSON(nodes, edges, inputShape, format) {
  const exportNodes = nodes.map(n => ({
    id: n.id,
    type: n.data?.layerType,
    position: n.position,
    config: n.data?.config || {},
  }))

  return JSON.stringify({
    version: '1.0',
    format,
    inputShape,
    nodes: exportNodes,
    edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
  }, null, 2)
}