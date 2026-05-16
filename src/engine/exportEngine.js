// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Gyan Shresth
// See LICENSE file in the project root for full license text.

import { propagateGraph, formatShape } from './shapeEngine.js'



function topoSortIds(nodes, edges) {
  const adj = {}
  const inDegree = {}
  for (const n of nodes) { adj[n.id] = []; inDegree[n.id] = 0 }
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


function makePyTorchNamer() {
  const counters = {}
  return function getLayerName(type) {
    const key = type.toLowerCase()
    counters[key] = (counters[key] || 0) + 1
    const s = counters[key]
    const names = {
      conv2d:             `conv${s}`,
      convtranspose2d:    `deconv${s}`,
      maxpool2d:          `pool${s}`,
      avgpool2d:          `avgpool${s}`,
      globalavgpool:      `gap`,
      adaptiveavgpool:    `adaptive_pool${s}`,
      dense:              `fc${s}`,
      flatten:            `flatten${s > 1 ? s : ''}`,
      batchnorm:          `bn${s}`,
      groupnorm:          `gn${s}`,
      layernorm:          `ln${s}`,
      dropout:            `drop${s > 1 ? s : ''}`,
      merge:              `merge${s}`,
      reshape:            `reshape${s}`,
      permute:            `permute${s}`,
      multiheadattention: `attn${s}`,
      lstm:               `lstm${s}`,
      gru:                `gru${s}`,
      embedding:          `embed${s}`,
      upsample:           `upsample${s}`,
      zeropad2d:          `pad${s}`,
    }
    return names[key] || `layer${s}`
  }
}

function makeKerasNamer() {
  const counters = {}
  return function getVarName(type) {
    const key = type.toLowerCase()
    counters[key] = (counters[key] || 0) + 1
    const s = counters[key]
    const map = {
      conv2d:             `x${s}`,
      convtranspose2d:    `dc${s}`,
      maxpool2d:          `p${s}`,
      avgpool2d:          `ap${s}`,
      globalavgpool:      `gap`,
      adaptiveavgpool:    `aap${s}`,
      dense:              `d${s}`,
      flatten:            `flat${s > 1 ? s : ''}`,
      batchnorm:          `bn${s}`,
      groupnorm:          `gn${s}`,
      layernorm:          `ln${s}`,
      dropout:            `drop${s > 1 ? s : ''}`,
      merge:              `merged${s}`,
      reshape:            `rs${s}`,
      permute:            `perm${s}`,
      multiheadattention: `attn${s}`,
      lstm:               `lstm${s}`,
      gru:                `gru${s}`,
      embedding:          `emb${s}`,
      upsample:           `up${s}`,
      zeropad2d:          `zp${s}`,
    }
    return map[key] || `layer${s}`
  }
}


export function exportToPyTorch(nodes, edges, inputShape) {
  const sorted = topoSortIds(nodes, edges)
  const results = propagateGraph(nodes, edges, inputShape)
  const getLayerName = makePyTorchNamer()

  const inputNode = nodes.find(n => n.data?.layerType === 'Input')
  const nonInputNodes = sorted
    .map(id => nodes.find(n => n.id === id))
    .filter(n => n && n.data?.layerType !== 'Input')

  const varNameMap = {}
  if (inputNode) varNameMap[inputNode.id] = 'x'

  const layerNameMap = {}     
  const initLines = []
  const forwardLines = []
  const sharedModules = {}    

  
  const isBranching = nonInputNodes.some(n => n.data?.layerType === 'Merge')

  for (const node of nonInputNodes) {
    const type = node.data?.layerType
    const cfg = node.data?.config || {}
    const name = getLayerName(type)
    layerNameMap[node.id] = name

    const inEdges = edges.filter(e => e.target === node.id)
    const primarySourceId = inEdges[0]?.source
    const inResult = primarySourceId ? results[primarySourceId] : null
    const inShape = inResult?.outputShape || null

   
    const outVar = name
    varNameMap[node.id] = outVar

    let initLine = ''
    let fwdLine = ''
    const srcVar = varNameMap[primarySourceId] || 'x'

    switch (type) {

      case 'Conv2D': {
        const inC = inShape?.[1] ?? '???'
        const { filters = 64, kernelSize = 3, stride = 1, padding = 0, dilation = 1 } = cfg
        initLine = `        self.${name} = nn.Conv2d(${inC}, ${filters}, kernel_size=${kernelSize}, stride=${stride}, padding=${padding}, dilation=${dilation})`
        fwdLine = `        ${outVar} = torch.relu(self.${name}(${srcVar}))`
        break
      }

      case 'ConvTranspose2D': {
        const inC = inShape?.[1] ?? '???'
        const { filters = 64, kernelSize = 2, stride = 2, padding = 0, outputPadding = 0 } = cfg
        initLine = `        self.${name} = nn.ConvTranspose2d(${inC}, ${filters}, kernel_size=${kernelSize}, stride=${stride}, padding=${padding}, output_padding=${outputPadding})`
        fwdLine = `        ${outVar} = torch.relu(self.${name}(${srcVar}))`
        break
      }

      case 'MaxPool2D': {
        const { kernelSize = 2, stride = 2, padding = 0 } = cfg
        initLine = `        self.${name} = nn.MaxPool2d(kernel_size=${kernelSize}, stride=${stride}, padding=${padding})`
        fwdLine = `        ${outVar} = self.${name}(${srcVar})`
        break
      }

      case 'AvgPool2D': {
        const { kernelSize = 2, stride = 2, padding = 0 } = cfg
        initLine = `        self.${name} = nn.AvgPool2d(kernel_size=${kernelSize}, stride=${stride}, padding=${padding})`
        fwdLine = `        ${outVar} = self.${name}(${srcVar})`
        break
      }

      case 'GlobalAvgPool': {
        initLine = `        self.${name} = nn.AdaptiveAvgPool2d(1)`
        fwdLine = `        ${outVar} = self.${name}(${srcVar}).flatten(1)  # [B, C]`
        break
      }

      case 'AdaptiveAvgPool': {
        const sz = cfg.outputSize ?? 1
        initLine = `        self.${name} = nn.AdaptiveAvgPool2d(${sz})`
        fwdLine = `        ${outVar} = self.${name}(${srcVar})`
        break
      }

      case 'Dense': {
        const inF = inShape ? inShape[inShape.length - 1] : '???'
        const { units = 256 } = cfg
        const isLast = nonInputNodes.indexOf(node) === nonInputNodes.length - 1
        initLine = `        self.${name} = nn.Linear(${inF}, ${units})`
        fwdLine = isLast
          ? `        ${outVar} = self.${name}(${srcVar})`
          : `        ${outVar} = torch.relu(self.${name}(${srcVar}))`
        break
      }

      case 'Flatten': {
        const startDim = cfg.startDim ?? 1
        initLine = `        self.${name} = nn.Flatten(start_dim=${startDim})`
        fwdLine = `        ${outVar} = self.${name}(${srcVar})`
        break
      }

      case 'BatchNorm': {
     
        const is1d = inShape && inShape.length === 2
        const channels = inShape ? (is1d ? inShape[1] : inShape[1]) : '???'
        const bnClass = is1d ? 'BatchNorm1d' : 'BatchNorm2d'
        const { eps = 1e-5, momentum = 0.1 } = cfg
        initLine = `        self.${name} = nn.${bnClass}(${channels}, eps=${eps}, momentum=${momentum})`
        fwdLine = `        ${outVar} = self.${name}(${srcVar})`
        break
      }

      case 'GroupNorm': {
        const channels = inShape?.[1] ?? '???'
        const { numGroups = 8 } = cfg
        initLine = `        self.${name} = nn.GroupNorm(num_groups=${numGroups}, num_channels=${channels})`
        fwdLine = `        ${outVar} = self.${name}(${srcVar})`
        break
      }

      case 'LayerNorm': {
        const normShape = inShape ? inShape.slice(1) : ['???']
        initLine = `        self.${name} = nn.LayerNorm([${normShape.join(', ')}])`
        fwdLine = `        ${outVar} = self.${name}(${srcVar})`
        break
      }

      case 'Dropout': {
        const { p = 0.5 } = cfg
    
        const is2d = inShape && inShape.length === 4
        const dpClass = is2d ? 'Dropout2d' : 'Dropout'
        initLine = `        self.${name} = nn.${dpClass}(p=${p})`
        fwdLine = `        ${outVar} = self.${name}(${srcVar})`
        break
      }

      case 'Upsample': {
        const { scaleFactor = 2, mode = 'nearest' } = cfg
        initLine = `        self.${name} = nn.Upsample(scale_factor=${scaleFactor}, mode='${mode}')`
        fwdLine = `        ${outVar} = self.${name}(${srcVar})`
        break
      }

      case 'ZeroPad2D': {
        const { padding = 1 } = cfg
        initLine = `        self.${name} = nn.ZeroPad2d(${padding})`
        fwdLine = `        ${outVar} = self.${name}(${srcVar})`
        break
      }

      case 'Merge': {
        const mode = cfg.mode || 'add'
        const parentVars = inEdges.map(e => varNameMap[e.source]).filter(Boolean)
        if (mode === 'add') {
          
          if (parentVars.length === 2) {
            fwdLine = `        ${outVar} = ${parentVars[0]} + ${parentVars[1]}  # residual ADD`
          } else if (parentVars.length > 2) {
            fwdLine = `        ${outVar} = ${parentVars.join(' + ')}  # multi-input ADD`
          } else {
            fwdLine = `        ${outVar} = ${parentVars[0] || 'x'}  # ADD (single input)`
          }
        } else {
          fwdLine = `        ${outVar} = torch.cat([${parentVars.join(', ')}], dim=1)  # CONCAT along C`
        }
        break
      }

      case 'Reshape': {
        if (cfg._unsqueeze) {
          fwdLine = `        ${outVar} = ${srcVar}.unsqueeze(${cfg.dim ?? 1})`
        } else if (cfg._squeeze) {
          fwdLine = `        ${outVar} = ${srcVar}.squeeze(${cfg.dim ?? 1})`
        } else if (cfg._reduce) {
          fwdLine = `        ${outVar} = ${srcVar}.mean(dim=${cfg.dim ?? 1}${cfg.keepdim ? ', keepdim=True' : ''})`
        } else {
          const dims = [cfg.targetC, cfg.targetH, cfg.targetW].filter(d => d !== undefined && d !== null)
          const dimStr = dims.length ? dims.join(', ') : '???'
          fwdLine = `        ${outVar} = ${srcVar}.view(${srcVar}.size(0), ${dimStr})`
        }
        break
      }

      case 'Permute': {
        if (cfg._transpose) {
          const [da, db] = cfg.dims ?? [1, 2]
          fwdLine = `        ${outVar} = ${srcVar}.transpose(${da}, ${db}).contiguous()`
        } else {
          const perm = (cfg.permutation ?? [0, 1, 2, 3]).join(', ')
          fwdLine = `        ${outVar} = ${srcVar}.permute(${perm}).contiguous()`
        }
        break
      }

      case 'MultiHeadAttention': {
        const { embed_dim = 512, num_heads = 8, dropout = 0.1 } = cfg
        initLine = `        self.${name} = nn.MultiheadAttention(embed_dim=${embed_dim}, num_heads=${num_heads}, dropout=${dropout}, batch_first=True)`
        fwdLine = `        ${outVar}, _ = self.${name}(${srcVar}, ${srcVar}, ${srcVar})  # self-attention`
        break
      }

      case 'LSTM': {
        const input_size = inShape?.[2] ?? '???'
        const { hidden_size = 256, num_layers = 1, bidirectional = false, return_sequences = true } = cfg
        initLine = `        self.${name} = nn.LSTM(input_size=${input_size}, hidden_size=${hidden_size}, num_layers=${num_layers}, batch_first=True, bidirectional=${bidirectional ? 'True' : 'False'})`
        if (return_sequences) {
          fwdLine = `        ${outVar}, _ = self.${name}(${srcVar})  # (B, seq_len, hidden${bidirectional ? '*2' : ''})`
        } else {
          fwdLine = `        ${outVar}_seq, _ = self.${name}(${srcVar})\n        ${outVar} = ${outVar}_seq[:, -1, :]  # last timestep`
        }
        break
      }

      case 'GRU': {
        const input_size = inShape?.[2] ?? '???'
        const { hidden_size = 256, num_layers = 1, bidirectional = false, return_sequences = true } = cfg
        initLine = `        self.${name} = nn.GRU(input_size=${input_size}, hidden_size=${hidden_size}, num_layers=${num_layers}, batch_first=True, bidirectional=${bidirectional ? 'True' : 'False'})`
        if (return_sequences) {
          fwdLine = `        ${outVar}, _ = self.${name}(${srcVar})  # (B, seq_len, hidden${bidirectional ? '*2' : ''})`
        } else {
          fwdLine = `        ${outVar}_seq, _ = self.${name}(${srcVar})\n        ${outVar} = ${outVar}_seq[:, -1, :]  # last timestep`
        }
        break
      }

      case 'Embedding': {
        const { num_embeddings = 10000, embedding_dim = 256 } = cfg
        initLine = `        self.${name} = nn.Embedding(num_embeddings=${num_embeddings}, embedding_dim=${embedding_dim})`
        fwdLine = `        ${outVar} = self.${name}(${srcVar})  # (B, seq_len, embed_dim)`
        break
      }

      default:
        fwdLine = `        # ${type} — not yet implemented`
    }

    if (initLine) initLines.push(initLine)
    if (fwdLine) forwardLines.push(fwdLine)
  }

  const [b, c, h, w] = inputShape
  const batchCode = (b === null || b === undefined) ? 2 : b


  const lastNode = nonInputNodes[nonInputNodes.length - 1]
  const returnVar = lastNode ? (varNameMap[lastNode.id] || 'x') : 'x'

  const hasSequence = nonInputNodes.some(n => ['LSTM', 'GRU', 'Embedding'].includes(n.data?.layerType))
  let testInput
  if (hasSequence) {
    testInput = `torch.randint(0, ${(nonInputNodes.find(n => n.data?.layerType === 'Embedding')?.data?.config?.num_embeddings ?? 10000)}, (${batchCode}, ${h ?? 32}))  # (B, seq_len)`
  } else if (c && h && w) {
    testInput = `torch.randn(${batchCode}, ${c}, ${h}, ${w})`
  } else {
    testInput = `torch.randn(${batchCode}, ${c ?? '???'})`
  }

  return `import torch
import torch.nn as nn
import torch.nn.functional as F


class GeneratedModel(nn.Module):
    def __init__(self):
        super().__init__()
${initLines.length > 0 ? initLines.join('\n') : '        pass'}

    def forward(self, x):
${forwardLines.length > 0 ? forwardLines.join('\n') : '        pass'}
        return ${returnVar}


if __name__ == '__main__':
    model = GeneratedModel()
    model.eval()
    print(model)
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Total params: {total_params:,}  Trainable: {trainable_params:,}")
    x = ${testInput}
    with torch.no_grad():
        out = model(x)
    print(f"Input shape:  {x.shape}")
    print(f"Output shape: {out.shape}")
`
}



export function exportToKeras(nodes, edges, inputShape) {
  const sorted = topoSortIds(nodes, edges)
  const results = propagateGraph(nodes, edges, inputShape)
  const getVarName = makeKerasNamer()

  const inputNode = nodes.find(n => n.data?.layerType === 'Input')
  const nonInputNodes = sorted
    .map(id => nodes.find(n => n.id === id))
    .filter(n => n && n.data?.layerType !== 'Input')

 
  const tensorVarOf = {}
  if (inputNode) tensorVarOf[inputNode.id] = 'inputs'

  const lines = []

  for (const node of nonInputNodes) {
    const type = node.data?.layerType
    const cfg = node.data?.config || {}
    const varName = getVarName(type)

    const inEdges = edges.filter(e => e.target === node.id)
    const primarySourceId = inEdges[0]?.source
    const inResult = primarySourceId ? results[primarySourceId] : null
    const inShape = inResult?.outputShape || null
    const srcVar = tensorVarOf[primarySourceId] || 'inputs'

    tensorVarOf[node.id] = varName

    switch (type) {

      case 'Conv2D': {
        const { filters = 64, kernelSize = 3, stride = 1, padding = 0, dilation = 1 } = cfg
        const pad = padding > 0 ? "'same'" : "'valid'"
        lines.push(`${varName} = layers.Conv2D(${filters}, kernel_size=${kernelSize}, strides=${stride}, padding=${pad}, dilation_rate=${dilation}, activation='relu')(${srcVar})`)
        break
      }

      case 'ConvTranspose2D': {
        const { filters = 64, kernelSize = 2, stride = 2, padding = 0 } = cfg
        const pad = padding > 0 ? "'same'" : "'valid'"
        lines.push(`${varName} = layers.Conv2DTranspose(${filters}, kernel_size=${kernelSize}, strides=${stride}, padding=${pad}, activation='relu')(${srcVar})`)
        break
      }

      case 'MaxPool2D': {
        const { kernelSize = 2, stride = 2 } = cfg
        lines.push(`${varName} = layers.MaxPooling2D(pool_size=${kernelSize}, strides=${stride})(${srcVar})`)
        break
      }

      case 'AvgPool2D': {
        const { kernelSize = 2, stride = 2 } = cfg
        lines.push(`${varName} = layers.AveragePooling2D(pool_size=${kernelSize}, strides=${stride})(${srcVar})`)
        break
      }

      case 'GlobalAvgPool': {
        lines.push(`${varName} = layers.GlobalAveragePooling2D()(${srcVar})`)
        break
      }

      case 'AdaptiveAvgPool': {
        const sz = cfg.outputSize ?? 1
     
        lines.push(`${varName} = layers.AveragePooling2D(pool_size=${sz}, padding='valid')(${srcVar})  # approx AdaptiveAvgPool`)
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

      case 'GroupNorm': {
        const { numGroups = 8 } = cfg
        lines.push(`${varName} = layers.GroupNormalization(groups=${numGroups})(${srcVar})`)
        break
      }

      case 'LayerNorm': {
        lines.push(`${varName} = layers.LayerNormalization()(${srcVar})`)
        break
      }

      case 'Dropout': {
        const { p = 0.5 } = cfg
        lines.push(`${varName} = layers.Dropout(rate=${p})(${srcVar})`)
        break
      }

      case 'Upsample': {
        const { scaleFactor = 2 } = cfg
        lines.push(`${varName} = layers.UpSampling2D(size=${scaleFactor})(${srcVar})`)
        break
      }

      case 'ZeroPad2D': {
        const { padding = 1 } = cfg
        lines.push(`${varName} = layers.ZeroPadding2D(padding=${padding})(${srcVar})`)
        break
      }

      case 'Merge': {
        const mode = cfg.mode || 'add'
        const parentVars = inEdges.map(e => tensorVarOf[e.source]).filter(Boolean)
        if (mode === 'add') {
          if (parentVars.length >= 2) {
            lines.push(`${varName} = layers.Add()([${parentVars.join(', ')}])`)
          } else {
            lines.push(`${varName} = ${parentVars[0] || 'inputs'}  # ADD (single input — check graph)`)
          }
        } else {
         
          lines.push(`${varName} = layers.Concatenate(axis=-1)([${parentVars.join(', ')}])  # CONCAT (channels-last)`)
        }
        break
      }

      case 'Reshape': {
        if (cfg._unsqueeze) {
          lines.push(`${varName} = tf.expand_dims(${srcVar}, axis=${cfg.dim ?? -1})`)
        } else if (cfg._squeeze) {
          lines.push(`${varName} = tf.squeeze(${srcVar}, axis=${cfg.dim ?? -1})`)
        } else if (cfg._reduce) {
          lines.push(`${varName} = tf.reduce_mean(${srcVar}, axis=${cfg.dim ?? 1}${cfg.keepdim ? ', keepdims=True' : ''})`)
        } else {
          const dims = [cfg.targetC, cfg.targetH, cfg.targetW].filter(d => d !== undefined && d !== null)
          lines.push(`${varName} = layers.Reshape((${dims.join(', ')},))(${srcVar})`)
        }
        break
      }

      case 'Permute': {
        if (cfg._transpose) {
          const [da, db] = cfg.dims ?? [1, 2]
     
          lines.push(`${varName} = layers.Permute((${da}, ${db}))(${srcVar})`)
        } else {
          const perm = (cfg.permutation ?? [0, 1, 2, 3]).slice(1)
          lines.push(`${varName} = layers.Permute((${perm.join(', ')},))(${srcVar})  # 1-indexed, excludes batch`)
        }
        break
      }

      case 'MultiHeadAttention': {
        const { embed_dim = 512, num_heads = 8, dropout = 0.1 } = cfg
        const key_dim = Math.floor(embed_dim / num_heads)
        lines.push(`${varName} = layers.MultiHeadAttention(num_heads=${num_heads}, key_dim=${key_dim}, dropout=${dropout})(${srcVar}, ${srcVar})`)
        break
      }

      case 'LSTM': {
        const { hidden_size = 256, bidirectional = false, return_sequences = true } = cfg
        const lstmLayer = `layers.LSTM(${hidden_size}, return_sequences=${return_sequences ? 'True' : 'False'})`
        if (bidirectional) {
          lines.push(`${varName} = layers.Bidirectional(${lstmLayer})(${srcVar})`)
        } else {
          lines.push(`${varName} = ${lstmLayer}(${srcVar})`)
        }
        break
      }

      case 'GRU': {
        const { hidden_size = 256, bidirectional = false, return_sequences = true } = cfg
        const gruLayer = `layers.GRU(${hidden_size}, return_sequences=${return_sequences ? 'True' : 'False'})`
        if (bidirectional) {
          lines.push(`${varName} = layers.Bidirectional(${gruLayer})(${srcVar})`)
        } else {
          lines.push(`${varName} = ${gruLayer}(${srcVar})`)
        }
        break
      }

      case 'Embedding': {
        const { num_embeddings = 10000, embedding_dim = 256 } = cfg
        lines.push(`${varName} = layers.Embedding(input_dim=${num_embeddings}, output_dim=${embedding_dim})(${srcVar})`)
        break
      }

      default:
        lines.push(`# ${type} — not yet mapped to Keras`)
    }
  }

  const [b, c, h, w] = inputShape
  const batchSize = b === null ? 'None' : b

  const lastNode = nonInputNodes[nonInputNodes.length - 1]
  const lastVar = lastNode ? (tensorVarOf[lastNode.id] || 'inputs') : 'inputs'

  const hasSeq = nonInputNodes.some(n => ['LSTM', 'GRU', 'Embedding'].includes(n.data?.layerType))
  let inputSpec, testInput
  if (hasSeq) {
    inputSpec = `shape=(${h ?? 32},), dtype=tf.int32`
    testInput = `np.random.randint(0, 1000, (${batchSize ?? 1}, ${h ?? 32}))`
  } else {
    inputSpec = `shape=(${h ?? '???'}, ${w ?? '???'}, ${c ?? '???'})`
    testInput = `np.random.randn(${batchSize ?? 1}, ${h ?? '???'}, ${w ?? '???'}, ${c ?? '???'}).astype('float32')`
  }

  return `import tensorflow as tf
import numpy as np
from tensorflow.keras import layers, Model


# Functional API — supports all DAG topologies including skip connections
inputs = tf.keras.Input(${inputSpec})

${lines.join('\n')}

model = Model(inputs=inputs, outputs=${lastVar})
model.summary()

if __name__ == '__main__':
    x = ${testInput}
    out = model.predict(x)
    print(f"Input shape:  {x.shape}")
    print(f"Output shape: {out.shape}")
`
}

 

export function exportToJSON(nodes, edges, inputShape, format) {
  const exportNodes = nodes.map(n => ({
    id: n.id,
    type: n.data?.layerType,
    position: n.position,
    config: n.data?.config || {},
  }))

  return JSON.stringify({
    version: '2.0',
    format,
    inputShape,
    nodes: exportNodes,
    edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
  }, null, 2)
}