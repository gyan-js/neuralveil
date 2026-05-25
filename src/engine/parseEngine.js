// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Gyan Shresth
// See LICENSE file in the project root for full license text.

function stripNoise(code) {

  let c = code.replace(/"""[\s\S]*?"""/g, '').replace(/'''[\s\S]*?'''/g, '')
  c = c.replace(/:\s*(?:Optional\[)?[\w\[\], .]+(?:\])?(?=\s*[,)=])/g, '')
  c = c.replace(/->\s*[\w\[\], .]+(?:\])?(?=\s*:)/g, '')
  c = c.replace(/#[^\n]*/g, '')
  return c
}


function balancedParens(s, start = 0) {
  const open = s.indexOf('(', start)
  if (open === -1) return null
  let depth = 0
  for (let i = open; i < s.length; i++) {
    if (s[i] === '(') depth++
    else if (s[i] === ')') { depth--; if (depth === 0) return [open, i] }
  }
  return null
}

function extractArgString(callStr) {
  const span = balancedParens(callStr)
  return span ? callStr.slice(span[0] + 1, span[1]) : ''
}

function splitArgs(argStr) {
  const args = []
  let depth = 0, current = ''
  for (const ch of argStr) {
    if ('([{'.includes(ch)) { depth++; current += ch }
    else if (')]}'.includes(ch)) { depth--; current += ch }
    else if (ch === ',' && depth === 0) { args.push(current.trim()); current = '' }
    else current += ch
  }
  if (current.trim()) args.push(current.trim())
  return args
}

export function extractLayerArgs(argStr) {
  const tokens = splitArgs(argStr)
  const positional = [], kwargs = {}
  for (const t of tokens) {
    const eq = t.indexOf('=')
    if (eq !== -1 && !/['"\[(]/.test(t.slice(0, eq))) {
      kwargs[t.slice(0, eq).trim()] = t.slice(eq + 1).trim()
    } else {
      positional.push(t)
    }
  }
  return { positional, kwargs }
}

function resolveNum(token, fallback = null, warnings = [], ctx = '') {
  if (token === undefined || token === null) return fallback
  const s = String(token).trim()
  const tupleMatch = s.match(/^\(?\s*(\d+)\s*(?:,\s*\d+)?\s*\)?$/)
  if (tupleMatch) return Number(tupleMatch[1])
  const n = Number(s)
  if (!isNaN(n) && s !== '') return n
  if (warnings && ctx) warnings.push(`${ctx}: could not resolve "${s}" — used default.`)
  return fallback
}

function resolveBool(token, fallback = false) {
  if (token === undefined) return fallback
  const s = String(token).trim()
  return s === 'True' || s === 'true' ? true : s === 'False' || s === 'false' ? false : fallback
}

let _uid = 2000
function uid() { return `p-${++_uid}` }



export function detectFramework(code) {
  const c = code.toLowerCase()
  const torch = c.includes('import torch') || c.includes('nn.module') ||
    c.includes('nn.sequential') || c.includes('nn.conv2d') || c.includes('nn.linear') ||
    c.includes('torch.nn') || c.includes('f.relu') || c.includes('torch.cat') ||
    c.includes('torch.nn.functional')
  const tf = c.includes('import tensorflow') || c.includes('from tensorflow') ||
    c.includes('keras') || c.includes('tf.keras') || c.includes('layers.conv2d') ||
    c.includes('model.add') || c.includes('layers.dense') || c.includes('layers.input')
  if (torch && !tf) return 'pytorch'
  if (tf && !torch) return 'tensorflow'
  if (torch && tf) return 'pytorch'
  return 'unknown'
}



function inferInputShape(code) {
 
  const randnMatch = code.match(/torch\.(?:randn|zeros|ones)\s*\(\s*([\d\s,]+)\)/)
  if (randnMatch) {
    const dims = randnMatch[1].split(',').map(d => parseInt(d.trim())).filter(n => !isNaN(n))
    if (dims.length >= 2) return dims
  }
  
  const kerasInputMatch = code.match(/Input\s*\(\s*shape\s*=\s*\(([^)]+)\)/)
  if (kerasInputMatch) {
    const dims = kerasInputMatch[1].split(',').map(d => parseInt(d.trim())).filter(n => !isNaN(n))
    if (dims.length === 3) return [1, dims[2], dims[0], dims[1]]
    if (dims.length === 2) return [1, dims[1], dims[0]]
  }
  return null
}

function parsePyTorchLayerCall(s, warnings) {
  const w = warnings

  if (s.match(/nn\.Conv2d\s*\(/)) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    return {
      layerType: 'Conv2D',
      config: {
        filters:     resolveNum(k.out_channels ?? p[1], 64,  w, 'Conv2D'),
        kernelSize:  resolveNum(k.kernel_size   ?? p[2], 3,   w, 'Conv2D'),
        stride:      resolveNum(k.stride        ?? p[3], 1,   w, 'Conv2D'),
        padding:     resolveNum(k.padding       ?? p[4], 0,   w, 'Conv2D'),
        dilation:    resolveNum(k.dilation      ?? p[5], 1,   w, 'Conv2D'),
        _inChannels: resolveNum(k.in_channels   ?? p[0], null, w, 'Conv2D'),
      },
    }
  }

  if (s.match(/nn\.ConvTranspose2d\s*\(/)) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    return {
      layerType: 'ConvTranspose2D',
      config: {
        filters:       resolveNum(k.out_channels    ?? p[1], 64, w, 'ConvTranspose2D'),
        kernelSize:    resolveNum(k.kernel_size      ?? p[2], 2,  w, 'ConvTranspose2D'),
        stride:        resolveNum(k.stride           ?? p[3], 2,  w, 'ConvTranspose2D'),
        padding:       resolveNum(k.padding          ?? p[4], 0,  w, 'ConvTranspose2D'),
        outputPadding: resolveNum(k.output_padding   ?? p[5], 0,  w, 'ConvTranspose2D'),
        _inChannels:   resolveNum(k.in_channels      ?? p[0], null, w, 'ConvTranspose2D'),
      },
    }
  }

  if (s.match(/nn\.Linear\s*\(/)) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    return {
      layerType: 'Dense',
      config: {
        units:       resolveNum(k.out_features ?? p[1], 256,  w, 'Dense'),
        _inFeatures: resolveNum(k.in_features  ?? p[0], null, w, 'Dense'),
      },
    }
  }

  if (s.match(/nn\.MaxPool2d\s*\(/)) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    const ks = resolveNum(k.kernel_size ?? p[0], 2, w, 'MaxPool2D')
    return { layerType: 'MaxPool2D', config: { kernelSize: ks, stride: resolveNum(k.stride ?? p[1], ks, w, 'MaxPool2D'), padding: resolveNum(k.padding ?? p[2], 0, w, 'MaxPool2D') } }
  }

  if (s.match(/nn\.AvgPool2d\s*\(/)) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    const ks = resolveNum(k.kernel_size ?? p[0], 2, w, 'AvgPool2D')
    return { layerType: 'AvgPool2D', config: { kernelSize: ks, stride: resolveNum(k.stride ?? p[1], ks, w, 'AvgPool2D'), padding: resolveNum(k.padding ?? p[2], 0, w, 'AvgPool2D') } }
  }


  if (s.match(/nn\.AdaptiveAvgPool2d\s*\(\s*(?:1|\(\s*1\s*,\s*1\s*\))\s*\)/)) {
    return { layerType: 'GlobalAvgPool', config: {} }
  }

  if (s.match(/nn\.AdaptiveAvgPool2d\s*\(/)) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    const out = k.output_size ?? p[0] ?? '1'
    const size = resolveNum(out.replace(/[()]/g, '').split(',')[0], 1, w, 'AdaptiveAvgPool')
    return { layerType: 'AdaptiveAvgPool', config: { outputSize: size } }
  }

  if (s.match(/nn\.BatchNorm2d\s*\(/)) {
    const { kwargs: k } = extractLayerArgs(extractArgString(s))
    return { layerType: 'BatchNorm', config: { eps: resolveNum(k.eps, 1e-5, w, 'BatchNorm'), momentum: resolveNum(k.momentum, 0.1, w, 'BatchNorm') } }
  }

  if (s.match(/nn\.BatchNorm1d\s*\(/)) {
    return { layerType: 'BatchNorm', config: { eps: 1e-5, momentum: 0.1 } }
  }

  if (s.match(/nn\.LayerNorm\s*\(/)) {
    return { layerType: 'LayerNorm', config: {} }
  }

  if (s.match(/nn\.GroupNorm\s*\(/)) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    return { layerType: 'GroupNorm', config: { numGroups: resolveNum(k.num_groups ?? p[0], 8, w, 'GroupNorm') } }
  }

  if (s.match(/nn\.Dropout2?d?\s*\(/)) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    return { layerType: 'Dropout', config: { p: resolveNum(k.p ?? p[0], 0.5, w, 'Dropout') } }
  }

  if (s.match(/nn\.Flatten\s*\(/)) {
    const { kwargs: k } = extractLayerArgs(extractArgString(s))
    return { layerType: 'Flatten', config: { startDim: resolveNum(k.start_dim, 1, w, 'Flatten') } }
  }

  if (s.match(/nn\.Upsample\s*\(/)) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    return { layerType: 'Upsample', config: { scaleFactor: resolveNum(k.scale_factor ?? p[0], 2, w, 'Upsample'), mode: (k.mode ?? "'nearest'").replace(/['"]/g, '') } }
  }

  if (s.match(/nn\.ZeroPad2d\s*\(/)) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    const pad = resolveNum((k.padding ?? p[0] ?? '1').replace(/[()]/g, '').split(',')[0], 1, w, 'ZeroPad2D')
    return { layerType: 'ZeroPad2D', config: { padding: pad } }
  }

  if (s.match(/nn\.MultiheadAttention\s*\(/)) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    return {
      layerType: 'MultiHeadAttention',
      config: {
        embed_dim: resolveNum(k.embed_dim ?? p[0], 512, w, 'MHA'),
        num_heads: resolveNum(k.num_heads ?? p[1], 8,   w, 'MHA'),
        dropout:   resolveNum(k.dropout,            0.1, w, 'MHA'),
      },
    }
  }

  if (s.match(/nn\.LSTM\s*\(/)) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    return {
      layerType: 'LSTM',
      config: {
        hidden_size:      resolveNum(k.hidden_size ?? p[1], 256, w, 'LSTM'),
        num_layers:       resolveNum(k.num_layers  ?? p[2], 1,   w, 'LSTM'),
        bidirectional:    resolveBool(k.bidirectional, false),
        return_sequences: true,
        _inputSize:       resolveNum(k.input_size  ?? p[0], null, w, 'LSTM'),
      },
    }
  }

  if (s.match(/nn\.GRU\s*\(/)) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    return {
      layerType: 'GRU',
      config: {
        hidden_size:      resolveNum(k.hidden_size ?? p[1], 256, w, 'GRU'),
        num_layers:       resolveNum(k.num_layers  ?? p[2], 1,   w, 'GRU'),
        bidirectional:    resolveBool(k.bidirectional, false),
        return_sequences: true,
        _inputSize:       resolveNum(k.input_size  ?? p[0], null, w, 'GRU'),
      },
    }
  }

  if (s.match(/nn\.Embedding\s*\(/)) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    return {
      layerType: 'Embedding',
      config: {
        num_embeddings: resolveNum(k.num_embeddings ?? p[0], 10000, w, 'Embedding'),
        embedding_dim:  resolveNum(k.embedding_dim  ?? p[1], 256,   w, 'Embedding'),
      },
    }
  }

 
  if (s.match(/nn\.(ReLU|GELU|Sigmoid|Tanh|Softmax|LogSoftmax|LeakyReLU|ELU|SiLU|Mish|Hardswish|PReLU|Identity|SELU|Hardshrink|Tanhshrink|Threshold|Hardtanh)\s*\(/)) {
    return null
  }

  return 'unknown'
}

function parseKerasLayerCall(s, warnings) {
  const w = warnings
  const L = /(?:layers\.|tf\.keras\.layers\.|keras\.layers\.)/

  const match = (re) => s.match(new RegExp(L.source + re))

  if (match('Conv2D\\s*\\(')) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    const padStr = (k.padding ?? '').replace(/['"]/g, '').toLowerCase()
    return { layerType: 'Conv2D', config: { filters: resolveNum(k.filters ?? p[0], 64, w, 'Conv2D'), kernelSize: resolveNum(k.kernel_size ?? p[1], 3, w, 'Conv2D'), stride: resolveNum(k.strides ?? p[2], 1, w, 'Conv2D'), padding: padStr === 'same' ? 1 : 0, dilation: 1 } }
  }
  if (match('Conv2DTranspose\\s*\\(')) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    return { layerType: 'ConvTranspose2D', config: { filters: resolveNum(k.filters ?? p[0], 64, w, 'ConvTranspose2D'), kernelSize: resolveNum(k.kernel_size ?? p[1], 2, w, 'ConvTranspose2D'), stride: resolveNum(k.strides ?? p[2], 2, w, 'ConvTranspose2D'), padding: 0, outputPadding: 0 } }
  }
  if (match('Dense\\s*\\(')) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    return { layerType: 'Dense', config: { units: resolveNum(k.units ?? p[0], 256, w, 'Dense') } }
  }
  if (match('MaxPooling2D\\s*\\(')) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    const ks = resolveNum(k.pool_size ?? p[0], 2, w, 'MaxPool2D')
    return { layerType: 'MaxPool2D', config: { kernelSize: ks, stride: resolveNum(k.strides ?? p[1], ks, w, 'MaxPool2D'), padding: 0 } }
  }
  if (match('AveragePooling2D\\s*\\(')) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    const ks = resolveNum(k.pool_size ?? p[0], 2, w, 'AvgPool2D')
    return { layerType: 'AvgPool2D', config: { kernelSize: ks, stride: resolveNum(k.strides ?? p[1], ks, w, 'AvgPool2D'), padding: 0 } }
  }
  if (match('GlobalAveragePooling2D\\s*\\(')) return { layerType: 'GlobalAvgPool', config: {} }
  if (match('BatchNormalization\\s*\\(')) return { layerType: 'BatchNorm', config: { eps: 1e-5, momentum: 0.1 } }
  if (match('LayerNormalization\\s*\\(')) return { layerType: 'LayerNorm', config: {} }
  if (match('GroupNormalization\\s*\\(')) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    return { layerType: 'GroupNorm', config: { numGroups: resolveNum(k.groups ?? p[0], 8, w, 'GroupNorm') } }
  }
  if (match('Dropout\\s*\\(')) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    return { layerType: 'Dropout', config: { p: resolveNum(k.rate ?? p[0], 0.5, w, 'Dropout') } }
  }
  if (match('Flatten\\s*\\(')) return { layerType: 'Flatten', config: {} }
  if (match('Reshape\\s*\\(')) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    const targetStr = k.target_shape ?? p[0] ?? ''
    const dims = targetStr.replace(/[()[\]]/g, '').split(',').map(x => resolveNum(x.trim(), null, w, 'Reshape')).filter(x => x !== null)
    return { layerType: 'Reshape', config: { targetC: dims[0] ?? 64, targetH: dims[1], targetW: dims[2] } }
  }
  if (match('ZeroPadding2D\\s*\\(')) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    const pad = resolveNum((k.padding ?? p[0] ?? '1').replace(/[()]/g, '').split(',')[0], 1, w, 'ZeroPad2D')
    return { layerType: 'ZeroPad2D', config: { padding: pad } }
  }
  if (match('UpSampling2D\\s*\\(')) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    const sz = resolveNum((k.size ?? p[0] ?? '2').replace(/[()]/g, '').split(',')[0], 2, w, 'Upsample')
    return { layerType: 'Upsample', config: { scaleFactor: sz, mode: 'nearest' } }
  }
  if (match('MultiHeadAttention\\s*\\(')) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    const num_heads = resolveNum(k.num_heads ?? p[0], 8, w, 'MHA')
    const key_dim = resolveNum(k.key_dim ?? p[1], 64, w, 'MHA')
    return { layerType: 'MultiHeadAttention', config: { embed_dim: num_heads * key_dim, num_heads, dropout: 0.1 } }
  }
  if (match('(?:Bidirectional\\s*\\(\\s*(?:layers\\.)?)?LSTM\\s*\\(')) {
    const bidir = s.includes('Bidirectional')
    const inner = bidir ? s.replace(/.*?Bidirectional\s*\(\s*(?:layers\.)?/, '') : s
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(inner))
    return { layerType: 'LSTM', config: { hidden_size: resolveNum(k.units ?? p[0], 256, w, 'LSTM'), num_layers: 1, bidirectional: bidir, return_sequences: resolveBool(k.return_sequences, true) } }
  }
  if (match('(?:Bidirectional\\s*\\(\\s*(?:layers\\.)?)?GRU\\s*\\(')) {
    const bidir = s.includes('Bidirectional')
    const inner = bidir ? s.replace(/.*?Bidirectional\s*\(\s*(?:layers\.)?/, '') : s
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(inner))
    return { layerType: 'GRU', config: { hidden_size: resolveNum(k.units ?? p[0], 256, w, 'GRU'), num_layers: 1, bidirectional: bidir, return_sequences: resolveBool(k.return_sequences, true) } }
  }
  if (match('Embedding\\s*\\(')) {
    const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
    return { layerType: 'Embedding', config: { num_embeddings: resolveNum(k.input_dim ?? p[0], 10000, w, 'Embedding'), embedding_dim: resolveNum(k.output_dim ?? p[1], 256, w, 'Embedding') } }
  }
  if (match('Add\\s*\\(')) return { layerType: 'Merge', config: { mode: 'add' } }
  if (match('Concatenate\\s*\\(')) return { layerType: 'Merge', config: { mode: 'concat' } }
  if (match('Lambda\\s*\\(')) {
    warnings.push('Lambda layer detected — imported as Unknown (dynamic code).')
    return { layerType: 'Unknown', config: {}, label: 'Lambda' }
  }
  if (match('(?:ReLU|Activation|Softmax|Sigmoid|LeakyReLU|ELU|PReLU|GELU|Tanh)\\s*\\(')) return null

  return 'unknown'
}


function parseSequentialBody(body, warnings) {
  
  const callRegex = /nn\.\w+\s*\([^()]*(?:\([^()]*\)[^()]*)*\)/g
  const calls = body.match(callRegex) || []
  const layers = []
  for (const call of calls) {
    const r = parsePyTorchLayerCall(call, warnings)
    if (r === null) continue
    if (r === 'unknown') { warnings.push(`Unsupported layer in Sequential: "${call.slice(0, 30)}"`); continue }
    layers.push(r)
  }
  return layers
}


function extractSymbolTable(code, warnings) {
  const table = {}


  const normalised = code.replace(/\\\n/g, ' ')

 
  const seqRe = /self\.(\w+)\s*=\s*nn\.Sequential\s*\(/g
  let m
  while ((m = seqRe.exec(normalised)) !== null) {
    const attrName = m[1]
    const start = m.index + m[0].length - 1 
    const span = balancedParens(normalised, start)
    if (!span) continue
    const body = normalised.slice(span[0] + 1, span[1])
    const layers = parseSequentialBody(body, warnings)
    if (layers.length > 0) {
      table[attrName] = { layerType: '__sequential__', layers, _isSequential: true }
    }
  }


  const layerRe = /self\.(\w+)\s*=\s*(nn\.[A-Za-z0-9_]+\s*\([^;]*?\))\s*(?:\n|$)/g
  while ((m = layerRe.exec(normalised)) !== null) {
    const attrName = m[1]
    if (table[attrName]) continue 
    const callStr = m[2].trim()
    const r = parsePyTorchLayerCall(callStr, warnings)
    if (r === null) continue
    if (r === 'unknown') {
      const name = callStr.match(/nn\.(\w+)/)?.[1] || attrName
      warnings.push(`Unrecognised layer "nn.${name}" (self.${attrName}) — added as Unknown.`)
      table[attrName] = { layerType: 'Unknown', config: {}, label: name }
    } else {
      table[attrName] = r
    }
  }

  return table
}

function indentLevel(line) {
  const m = line.match(/^(\s*)/)
  return m ? m[1].length : 0
}


function extractForwardBody(code) {
  const fwdMatch = code.match(/def\s+forward\s*\(self[^)]*\)\s*:([\s\S]*?)(?=\n[ \t]{0,4}def\s|\n[ \t]{0,4}class\s|$)/)
  return fwdMatch ? fwdMatch[1] : ''
}


function traceForwardToSSA(forwardBody, symbolTable, warnings) {
  const ops = []
  const lines = forwardBody.split('\n')

 
  let i = 0

  function processLine(line, outerVarMap) {
    const s = line.trim()
    if (!s || /^(return\s|assert\s|print\s|#|raise\s|pass$)/.test(s)) return

   
    let mm = s.match(/^(\w+)\s*=\s*torch\.cat\s*\(\s*\[([^\]]+)\]\s*(?:,\s*dim\s*=\s*(-?\d+))?\s*\)/)
    if (mm) {
      const parents = mm[2].split(',').map(v => v.trim()).filter(Boolean)
      ops.push({ varOut: mm[1], op: 'cat', parents, dim: parseInt(mm[3] ?? '1') })
      return
    }
    mm = s.match(/^(\w+)\s*=\s*(\w+)\s*\+\s*(\w+)\s*$/)
    if (mm) {
      ops.push({ varOut: mm[1], op: 'add', parents: [mm[2], mm[3]] })
      return
    }

    
    mm = s.match(/^(\w+)\s*=\s*((?:\w+\s*\+\s*)+\w+)\s*$/)
    if (mm) {
      const parts = mm[2].split('+').map(v => v.trim()).filter(Boolean)
      if (parts.length > 2) {
    
        let prev = parts[0]
        for (let idx = 1; idx < parts.length; idx++) {
          const tmpVar = `__add_${uid()}`
          const outVar = idx === parts.length - 1 ? mm[1] : tmpVar
          ops.push({ varOut: outVar, op: 'add', parents: [prev, parts[idx]] })
          prev = outVar
        }
        return
      }
    }

    
    mm = s.match(/^(\w+)\s*=\s*(\w+)\.(?:view|reshape)\s*\((.+)\)$/)
    if (mm) {
      const dims = splitArgs(mm[3]).map(d => resolveNum(d, null))
      ops.push({ varOut: mm[1], op: 'view', parents: [mm[2]], dims })
      return
    }

   
    mm = s.match(/^(\w+)\s*=\s*(\w+)\.flatten\s*\((.*?)?\)$/)
    if (mm) {
      const startDim = resolveNum(splitArgs(mm[3] || '1')[0], 1)
      ops.push({ varOut: mm[1], op: 'flatten', parents: [mm[2]], startDim })
      return
    }

  
    mm = s.match(/^(\w+)\s*=\s*torch\.flatten\s*\(\s*(\w+)\s*(?:,\s*(\d+))?\s*\)/)
    if (mm) {
      ops.push({ varOut: mm[1], op: 'flatten', parents: [mm[2]], startDim: parseInt(mm[3] ?? '1') })
      return
    }

   
    mm = s.match(/^(\w+)\s*=\s*(\w+)\.permute\s*\((.+)\)/)
    if (mm) {
      const perm = splitArgs(mm[3]).map(d => parseInt(d)).filter(n => !isNaN(n))
      ops.push({ varOut: mm[1], op: 'permute', parents: [mm[2]], permutation: perm })
      return
    }


    mm = s.match(/^(\w+)\s*=\s*(\w+)\.transpose\s*\((.+)\)/)
    if (mm) {
      const [da, db] = splitArgs(mm[3]).map(d => parseInt(d))
      ops.push({ varOut: mm[1], op: 'transpose', parents: [mm[2]], dims: [da, db] })
      return
    }

    mm = s.match(/^(\w+)\s*=\s*(\w+)\.(?:contiguous|clone|detach|float|half|double)\s*\(.*?\)$/)
    if (mm) {
      ops.push({ varOut: mm[1], op: 'passthrough', parents: [mm[2]] })
      return
    }

  
    mm = s.match(/^(\w+)\s*=\s*(\w+)\.(squeeze|unsqueeze)\s*\((.*?)?\)/)
    if (mm) {
      const dim = resolveNum(mm[4], null)
      ops.push({ varOut: mm[1], op: mm[3], parents: [mm[2]], dim })
      return
    }


    mm = s.match(/^(\w+)\s*=\s*(\w+)\.(mean|sum|max|min)\s*\(\s*dim\s*=\s*(-?\d+)/)
    if (mm) {
      ops.push({ varOut: mm[1], op: 'reduce', parents: [mm[2]], dim: parseInt(mm[4]), keepdim: s.includes('keepdim=True') })
      return
    }

    
    mm = s.match(/^(\w+)\s*=\s*(\w+)\.chunk\s*\(.*?\)\s*\[0\]/)
    if (mm) {
      ops.push({ varOut: mm[1], op: 'passthrough', parents: [mm[2]] })
      return
    }

   
    mm = s.match(/^(\w+)\s*,\s*_+\s*=\s*self\.(\w+)\s*\((.+)\)$/)
    if (mm) {
      const [, outVar, attrName, argStr] = mm
      const argVars = splitArgs(argStr).map(v => extractFirstIdent(v)).filter(Boolean)
      if (symbolTable[attrName]) {
        ops.push({ varOut: outVar, op: 'layer', layerAttr: attrName, layerDef: symbolTable[attrName], parents: [argVars[0]].filter(Boolean) })
      } else {
        warnings.push(`self.${attrName} not found in __init__ — adding as Unknown.`)
        ops.push({ varOut: outVar, op: 'unknown', layerAttr: attrName, parents: [argVars[0]].filter(Boolean) })
      }
      return
    }

 
    mm = s.match(/^(\w+)\s*,\s*[\(_].*=\s*self\.(\w+)\s*\((.+)\)$/)
    if (mm) {
      const [, outVar, attrName, argStr] = mm
      const argVars = splitArgs(argStr).map(v => extractFirstIdent(v)).filter(Boolean)
      if (symbolTable[attrName]) {
        ops.push({ varOut: outVar, op: 'layer', layerAttr: attrName, layerDef: symbolTable[attrName], parents: [argVars[0]].filter(Boolean) })
      }
      return
    }

  
    mm = s.match(/^(\w+)\s*=\s*self\.(\w+)\s*\((.+)\)$/)
    if (mm) {
      const [, lhs, attrName, argStr] = mm
      const argVars = splitArgs(argStr).map(v => extractFirstIdent(v)).filter(Boolean)

      if (symbolTable[attrName]) {
        const def = symbolTable[attrName]
        
        ops.push({
          varOut: lhs,
          op: 'layer',
          layerAttr: attrName,
          layerDef: def,
          parents: [argVars[0]].filter(Boolean),
          _callSite: `${attrName}_${ops.filter(o => o.layerAttr === attrName).length}`,
        })
      } else {
        warnings.push(`self.${attrName} called but not in __init__ — adding as Unknown.`)
        ops.push({ varOut: lhs, op: 'unknown', layerAttr: attrName, parents: [argVars[0]].filter(Boolean) })
      }
      return
    }

    
    mm = s.match(/^(\w+)\s*=\s*[Ff]\.(?:relu|gelu|sigmoid|tanh|softmax|log_softmax|dropout|leaky_relu|elu|selu|hardswish|mish|silu)\s*\((\w+)/)
    if (mm) {
      ops.push({ varOut: mm[1], op: 'passthrough', parents: [mm[2]] })
      return
    }


    mm = s.match(/^(\w+)\s*=\s*torch\.(?:relu|sigmoid|tanh|gelu|softmax)\s*\((\w+)/)
    if (mm) {
      ops.push({ varOut: mm[1], op: 'passthrough', parents: [mm[2]] })
      return
    }

   
    mm = s.match(/^(\w+)\s*=\s*(\w+)\s*$/)
    if (mm && !/^\d/.test(mm[2])) {
      ops.push({ varOut: mm[1], op: 'passthrough', parents: [mm[2]] })
      return
    }
  }

  
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()
    const baseIndent = indentLevel(line)


    if (/^if\s+/.test(trimmed)) {
     
      const ifBodyLines = []
      const elseBodyLines = []
      const condIndent = baseIndent
      let inElse = false
      i++
      while (i < lines.length) {
        const inner = lines[i]
        const innerTrimmed = inner.trim()
        if (!innerTrimmed) { i++; continue }
        const innerIndent = indentLevel(inner)
        if (innerIndent <= condIndent && innerTrimmed !== '') {
          if (/^else\s*:/.test(innerTrimmed) || /^elif\s+/.test(innerTrimmed)) {
            inElse = true; i++; continue
          }
          break
        }
        if (inElse) elseBodyLines.push(inner)
        else ifBodyLines.push(inner)
        i++
      }

   
      const preBranchLen = ops.length
      for (const l of ifBodyLines) processLine(l)
      const ifOps = ops.splice(preBranchLen)

      for (const l of elseBodyLines) processLine(l)
      const elseOps = ops.splice(preBranchLen)

     
      const ifOut = ifOps.length ? ifOps[ifOps.length - 1].varOut : null
      const elseOut = elseOps.length ? elseOps[elseOps.length - 1].varOut : null

      ops.push(...ifOps)
      ops.push(...elseOps)

      if (ifOut && elseOut && ifOut !== elseOut) {
   
        const mergeVar = `__cond_${uid()}`
        ops.push({ varOut: mergeVar, op: 'add', parents: [ifOut, elseOut], _conditionalMerge: true })
        warnings.push(`Conditional branch detected — arms merged via ADD node. Review graph structure.`)
      }
      continue
    }

    if (/^for\s+\w+\s+in\s+/.test(trimmed)) {
      const loopIndent = baseIndent
      const loopBody = []
      i++
      while (i < lines.length) {
        const inner = lines[i]
        const innerTrimmed = inner.trim()
        if (!innerTrimmed) { i++; continue }
        if (indentLevel(inner) <= loopIndent) break
        loopBody.push(inner)
        i++
      }
      warnings.push(`Loop detected — graph represents one unrolled iteration.`)
      for (const l of loopBody) processLine(l)
      continue
    }

    processLine(line)
    i++
  }

  return ops
}

function extractFirstIdent(expr) {
  const m = expr.trim().match(/^(\w+)/)
  return m ? m[1] : ''
}


function buildGraphFromSSA(ops, inputNodeId, warnings) {
  const nodes = []
  const edges = []
  const edgeSet = new Set() 

  const varToNodeId = { x: inputNodeId, input: inputNodeId, inputs: inputNodeId }

  const attrUseCounts = {}


  let yPos = 155
  let branchXOffset = 0
  const BRANCH_SPACING = 280

  function addEdge(source, target) {
    const key = `${source}→${target}`
    if (!edgeSet.has(key) && source && target && source !== target) {
      edgeSet.add(key)
      edges.push({ id: `e-${source}-${target}-${uid()}`, source, target })
    }
  }

  function inlineSequential(seqDef, parentNodeId) {

    let prevId = parentNodeId
    for (const layer of seqDef.layers) {
      if (!layer?.layerType || layer.layerType === 'Unknown') continue
      const nid = uid()
      nodes.push({ id: nid, type: layer.layerType, position: { x: 300, y: yPos }, config: layer.config || {} })
      yPos += 130
      addEdge(prevId, nid)
      prevId = nid
    }
    return prevId
  }

  for (const op of ops) {
  
    if (op.op === 'passthrough') {
      const srcId = varToNodeId[op.parents[0]]
      if (srcId) varToNodeId[op.varOut] = srcId
      continue
    }


    if (op.op === 'layer') {
      const def = op.layerDef

   
      if (def._isSequential) {
        const parentId = varToNodeId[op.parents[0]]
        if (parentId !== undefined) {
          const lastId = inlineSequential(def, parentId)
          varToNodeId[op.varOut] = lastId
        }
        continue
      }

      const nodeId = uid()

    
      attrUseCounts[op.layerAttr] = (attrUseCounts[op.layerAttr] || 0) + 1
      const reuseCount = attrUseCounts[op.layerAttr]
      const config = { ...def.config }
      if (reuseCount > 1) {
        config._reuse = true
        warnings.push(`Module self.${op.layerAttr} called ${reuseCount} times — each call creates a distinct graph node (weight-shared in practice).`)
      }

      nodes.push({
        id: nodeId,
        type: def.layerType,
        position: { x: 300, y: yPos },
        config,
        _label: def.label,
      })
      yPos += 130

      for (const parentVar of (op.parents ?? [])) {
        const srcId = varToNodeId[parentVar]
        if (srcId) addEdge(srcId, nodeId)
      }
      varToNodeId[op.varOut] = nodeId
      continue
    }


    if (op.op === 'cat' || op.op === 'add') {
      const nodeId = uid()
      const mode = op.op === 'cat' ? 'concat' : 'add'
      nodes.push({ id: nodeId, type: 'Merge', position: { x: 300, y: yPos }, config: { mode } })
      yPos += 130

      for (const parentVar of op.parents) {
        const srcId = varToNodeId[parentVar]
        if (srcId) addEdge(srcId, nodeId)
      }
      varToNodeId[op.varOut] = nodeId
      continue
    }


    let layerDef = null

    if (op.op === 'view' || op.op === 'reshape') {
      const nonBatch = (op.dims ?? []).filter(d => d !== null && d !== -1)
      if (nonBatch.length >= 1) {
        layerDef = { layerType: 'Reshape', config: { targetC: nonBatch[0], targetH: nonBatch[1], targetW: nonBatch[2] } }
      } else {
        layerDef = { layerType: 'Reshape', config: { targetC: null, targetH: null, targetW: null } }
        warnings.push(`view/reshape at "${op.varOut}": could not resolve target shape — inspect manually.`)
      }
    } else if (op.op === 'flatten') {
      layerDef = { layerType: 'Flatten', config: { startDim: op.startDim ?? 1 } }
    } else if (op.op === 'permute') {
      layerDef = { layerType: 'Permute', config: { permutation: op.permutation } }
    } else if (op.op === 'unsqueeze') {
      layerDef = { layerType: 'Reshape', config: { _unsqueeze: true, dim: op.dim } }
    } else if (op.op === 'squeeze') {
      layerDef = { layerType: 'Reshape', config: { _squeeze: true, dim: op.dim } }
    } else if (op.op === 'transpose') {
      layerDef = { layerType: 'Permute', config: { _transpose: true, dims: op.dims } }
    } else if (op.op === 'reduce') {
      layerDef = { layerType: 'Reshape', config: { _reduce: true, dim: op.dim, keepdim: op.keepdim } }
    } else if (op.op === 'unknown') {
      layerDef = { layerType: 'Unknown', config: {}, label: op.layerAttr }
    }

    if (!layerDef) continue

    const nodeId = uid()
    nodes.push({
      id: nodeId,
      type: layerDef.layerType,
      position: { x: 300, y: yPos },
      config: layerDef.config || {},
      _label: layerDef.label,
    })
    yPos += 130

    for (const parentVar of (op.parents ?? [])) {
      const srcId = varToNodeId[parentVar]
      if (srcId) addEdge(srcId, nodeId)
    }
    varToNodeId[op.varOut] = nodeId
  }

  return { nodes, edges }
}


function spreadLayout(inputNode, nodes, edges) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  nodeMap.set(inputNode.id, inputNode)
  const allNodes = [inputNode, ...nodes]

  const children = new Map(allNodes.map(n => [n.id, []]))
  const parents = new Map(allNodes.map(n => [n.id, []]))
  for (const e of edges) {
    children.get(e.source)?.push(e.target)
    parents.get(e.target)?.push(e.source)
  }


  const depth = new Map()
  const queue = [inputNode.id]
  depth.set(inputNode.id, 0)
  const visited = new Set()
  while (queue.length) {
    const curr = queue.shift()
    if (visited.has(curr)) continue
    visited.add(curr)
    for (const child of (children.get(curr) || [])) {
      const d = Math.max(depth.get(child) ?? 0, (depth.get(curr) ?? 0) + 1)
      depth.set(child, d)
      queue.push(child)
    }
  }

 
  const byDepth = new Map()
  for (const [id, d] of depth) {
    if (!byDepth.has(d)) byDepth.set(d, [])
    byDepth.get(d).push(id)
  }

  const Y_STEP = 135
  const X_CENTER = 300
  const X_SPREAD = 290

  for (const [d, ids] of byDepth) {
    const count = ids.length
    ids.forEach((id, idx) => {
      const node = nodeMap.get(id)
      if (!node) return
      const xOffset = count === 1 ? 0 : (idx - (count - 1) / 2) * X_SPREAD
      node.position = { x: X_CENTER + xOffset, y: 30 + d * Y_STEP }
    })
  }
}



function buildSequentialGraph(layers, errors, warnings) {
  const nodes = []
  const edges = []
  const inputId = 'input'
  nodes.push({ id: inputId, type: 'Input', position: { x: 300, y: 30 }, config: {} })

  let prevId = inputId, yPos = 155
  for (const layer of layers) {
    if (!layer?.layerType || layer.layerType === 'Unknown') continue
    const id = uid()
    nodes.push({ id, type: layer.layerType, position: { x: 300, y: yPos }, config: layer.config || {} })
    edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id })
    prevId = id
    yPos += 130
  }
  return { layers: nodes, edges, inputShape: null, errors, warnings }
}



function runDiagnosticPass(nodes, edges, warnings) {
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))
  const parentsOf = {}
  for (const n of nodes) parentsOf[n.id] = []
  for (const e of edges) parentsOf[e.target]?.push(e.source)

  for (const node of nodes) {
    const type = node.type
    const parents = parentsOf[node.id] ?? []
    const parentType = parents[0] ? nodeMap[parents[0]]?.type : null

    if (type === 'Dense' && parentType && !['Flatten', 'Dense', 'Dropout', 'LSTM', 'GRU', 'GlobalAvgPool', 'AdaptiveAvgPool', 'Embedding', 'LayerNorm', 'Input'].includes(parentType)) {
      warnings.push(`⚠ Dense follows ${parentType} — a Flatten or GlobalAvgPool is likely missing.`)
    }
    if (type === 'MultiHeadAttention' && parentType && ['Conv2D', 'MaxPool2D', 'AvgPool2D', 'BatchNorm'].includes(parentType)) {
      warnings.push(`⚠ MultiHeadAttention follows spatial layer ${parentType}. Attention expects [B, seq_len, embed_dim].`)
    }
    if (type === 'Conv2D' && parentType && ['Flatten', 'Dense'].includes(parentType)) {
      warnings.push(`⚠ Conv2D follows ${parentType}. Conv2D requires 4D input [B, C, H, W].`)
    }
    if (type === 'LSTM' && parentType && ['Conv2D', 'MaxPool2D', 'AvgPool2D'].includes(parentType)) {
      warnings.push(`⚠ LSTM follows ${parentType}. LSTM expects 3D input [B, seq_len, input_size].`)
    }
    if (type === 'Merge' && parents.length < 2) {
      warnings.push(`⚠ Merge node has only ${parents.length} parent(s) — needs 2. Connect the second branch manually.`)
    }
  }
}


export function parsePyTorch(codeString) {
  const errors = [], warnings = []
  const code = stripNoise(codeString)

  const seqMatch = code.match(/nn\.Sequential\s*\(([\s\S]*?)\n\s*\)/)
  if (seqMatch) {
    const layers = parseSequentialBody(seqMatch[1], warnings)
    if (layers.length > 0) return buildSequentialGraph(layers, errors, warnings)
  }


  const symbolTable = extractSymbolTable(code, warnings)

  if (Object.keys(symbolTable).length === 0) {
    errors.push('No recognised PyTorch layers found (self.X = nn.Y(...)). Paste a class body with __init__ and forward().')
    return { layers: [], edges: [], inputShape: null, errors, warnings }
  }

  const forwardBody = extractForwardBody(code)

  if (!forwardBody.trim()) {
    warnings.push('forward() not found — building linear graph from __init__ order.')
    const layers = Object.values(symbolTable).filter(l => l.layerType && l.layerType !== 'Unknown' && !l._isSequential)
    return buildSequentialGraph(layers, errors, warnings)
  }

  const ops = traceForwardToSSA(forwardBody, symbolTable, warnings)

  if (ops.filter(o => o.op !== 'passthrough').length === 0) {
    warnings.push('forward() trace yielded no structural ops — building linear graph from __init__ order.')
    const layers = Object.values(symbolTable).filter(l => l.layerType && l.layerType !== 'Unknown' && !l._isSequential)
    return buildSequentialGraph(layers, errors, warnings)
  }

  const inputId = 'input'
  const inputNode = { id: inputId, type: 'Input', position: { x: 300, y: 30 }, config: {} }
  const { nodes, edges } = buildGraphFromSSA(ops, inputId, warnings)

 
  spreadLayout(inputNode, nodes, edges)

  return {
    layers: [inputNode, ...nodes],
    edges,
    inputShape: null,
    errors,
    warnings,
  }
}



export function parseTensorFlow(codeString) {
  const errors = [], warnings = []
  const code = stripNoise(codeString)


  const addMatches = [...code.matchAll(/model\.add\s*\(\s*([\s\S]*?)\s*\)/g)]
  if (addMatches.length > 0) {
    const layers = []
    for (const m of addMatches) {
      const r = parseKerasLayerCall(m[1], warnings)
      if (r === null) continue
      if (r === 'unknown') { warnings.push(`Unsupported Keras layer: "${m[1].slice(0, 40)}"`); continue }
      layers.push(r)
    }
    if (layers.length > 0) return buildSequentialGraph(layers, errors, warnings)
  }


  const seqListMatch = code.match(/Sequential\s*\(\s*\[([\s\S]*?)\]\s*\)/)
  if (seqListMatch) {
    const body = seqListMatch[1]
    const callRegex = /(?:layers\.|tf\.keras\.layers\.)\w+\s*\([^)]*(?:\([^)]*\)[^)]*)*\)/g
    const calls = body.match(callRegex) || []
    const layers = []
    for (const call of calls) {
      const r = parseKerasLayerCall(call, warnings)
      if (r === null) continue
      if (r === 'unknown') continue
      layers.push(r)
    }
    if (layers.length > 0) return buildSequentialGraph(layers, errors, warnings)
  }

 
  const lines = code.split('\n').map(l => l.trim()).filter(Boolean)
  const nodes = []
  const edges = []
  const edgeSet = new Set()
  const varToId = {}
  let yPos = 155

  const inputId = 'input'
  nodes.push({ id: inputId, type: 'Input', position: { x: 300, y: 30 }, config: {} })

  const inputVarMatch = code.match(/(\w+)\s*=\s*(?:tf\.keras\.Input|keras\.Input|Input)\s*\(/)
  const inputVar = inputVarMatch ? inputVarMatch[1] : 'inputs'
  varToId[inputVar] = inputId

  function addEdge(src, tgt) {
    const key = `${src}→${tgt}`
    if (!edgeSet.has(key) && src && tgt) {
      edgeSet.add(key)
      edges.push({ id: `e-${src}-${tgt}-${uid()}`, source: src, target: tgt })
    }
  }

  for (const line of lines) {
   
    const funcApiMatch = line.match(/^(\w+)\s*=\s*((?:layers\.|tf\.keras\.layers\.|keras\.layers\.)[^(]+\s*\([^)]*(?:\([^)]*\)[^)]*)*\))\s*\(([^)]*)\)/)
    if (funcApiMatch) {
      const [, lhs, layerCall, srcStr] = funcApiMatch
      const r = parseKerasLayerCall(layerCall, warnings)
      if (r === null) continue
      if (r === 'unknown') { warnings.push(`Unknown Keras layer: ${layerCall.slice(0, 40)}`); continue }

      const nodeId = uid()
      nodes.push({ id: nodeId, type: r.layerType, position: { x: 300, y: yPos }, config: r.config || {} })
      yPos += 130

      const srcVars = srcStr.replace(/[\[\]]/g, '').split(',').map(v => v.trim()).filter(Boolean)
      for (const sv of srcVars) {
        const srcId = varToId[sv]
        if (srcId) addEdge(srcId, nodeId)
      }
      varToId[lhs] = nodeId
      continue
    }


    const mergeMatch = line.match(/^(\w+)\s*=\s*(?:layers\.Add|layers\.Concatenate)[^(]*\(\)\s*\(\[([^\]]+)\]\)/)
    if (mergeMatch) {
      const [, lhs, srcsStr] = mergeMatch
      const mode = line.includes('Concatenate') ? 'concat' : 'add'
      const nodeId = uid()
      nodes.push({ id: nodeId, type: 'Merge', position: { x: 300, y: yPos }, config: { mode } })
      yPos += 130
      for (const sv of srcsStr.split(',').map(v => v.trim())) {
        const srcId = varToId[sv]
        if (srcId) addEdge(srcId, nodeId)
      }
      varToId[lhs] = nodeId
      continue
    }


    const tfOpMatch = line.match(/^(\w+)\s*=\s*tf\.(reshape|transpose)\s*\((\w+)\s*,\s*(.+)\)/)
    if (tfOpMatch) {
      const [, lhs, tfOp, srcVar, argStr] = tfOpMatch
      const srcId = varToId[srcVar]
      if (!srcId) continue
      const nodeId = uid()
      if (tfOp === 'reshape') {
        const dims = argStr.replace(/[()[\]]/g, '').split(',').map(x => resolveNum(x.trim(), null)).filter(x => x !== null && x !== -1)
        nodes.push({ id: nodeId, type: 'Reshape', position: { x: 300, y: yPos }, config: { targetC: dims[0], targetH: dims[1], targetW: dims[2] } })
      } else {
        const perm = argStr.replace(/[()[\]]/g, '').split(',').map(d => parseInt(d.trim())).filter(n => !isNaN(n))
        nodes.push({ id: nodeId, type: 'Permute', position: { x: 300, y: yPos }, config: { permutation: perm } })
      }
      yPos += 130
      addEdge(srcId, nodeId)
      varToId[lhs] = nodeId
      continue
    }
  }

  if (nodes.length <= 1) {
    errors.push('No recognised Keras/TF layers found. Paste a model using layers.X() or model.add() patterns.')
    return { layers: [], edges: [], inputShape: null, errors, warnings }
  }


  const inputNodeObj = { id: inputId, type: 'Input', position: { x: 300, y: 30 }, config: {} }
  const nonInput = nodes.filter(n => n.id !== inputId)
  spreadLayout(inputNodeObj, nonInput, edges)

  nodes.find(n => n.id === inputId).position = { x: 300, y: 30 }

  return { layers: nodes, edges, inputShape: null, errors, warnings }
}



export function parseErrors(codeString) {
  const errors = []
  if (!codeString?.trim()) {
    errors.push('No code provided. Paste your PyTorch or Keras model definition.')
    return errors
  }
  const fw = detectFramework(codeString)
  if (fw === 'unknown') {
    errors.push('Could not detect framework. Ensure your code imports torch or tensorflow/keras.')
  }
  const opens = (codeString.match(/\(/g) || []).length
  const closes = (codeString.match(/\)/g) || []).length
  if (Math.abs(opens - closes) > 10) {
    errors.push('Parenthesis mismatch detected — code may be incomplete or truncated.')
  }
  return errors
}

export function parseCode(codeString) {
  const quickErrors = parseErrors(codeString)
  if (!codeString?.trim()) {
    return { nodes: [], edges: [], inputShape: null, errors: quickErrors, warnings: [], framework: 'unknown' }
  }

  const framework = detectFramework(codeString)
  const cleanCode = stripNoise(codeString)

  let result
  if (framework === 'tensorflow') {
    result = parseTensorFlow(codeString)
  } else {
    result = parsePyTorch(codeString)
  }

  const nodes = result.layers || []
  const edges = result.edges || []

  runDiagnosticPass(nodes, edges, result.warnings)

  const inferredShape = inferInputShape(cleanCode)

  return {
    nodes,
    edges,
    inputShape: inferredShape || result.inputShape || null,
    errors: [...quickErrors.filter(e => !result.errors.includes(e)), ...result.errors],
    warnings: result.warnings || [],
    framework,
  }
}



export function computeConfidence(codeString, parseResult) {
  if (!codeString || !codeString.trim()) return 0.0

  let score = 0.7  

  const code = codeString



  if (/nn\.Sequential\s*\(\s*\*\w+/.test(code)) {
    score -= 0.4
  }

 
  if (/for\s+\w+\s+in\s+.+:\s*\n\s+self\.\w+\s*=/.test(code)) {
    score -= 0.3
  }

  const varArgMatches = code.match(/nn\.\w+\s*\(\s*[a-zA-Z_]\w*\s*[,)]/g) || []
  const varArgPenalty = Math.min(varArgMatches.length * 0.1, 0.4)
  score -= varArgPenalty

  const hasCustomModule = /class\s+\w+\s*\(\s*(?:nn\.Module|torch\.nn\.Module)\s*\)/.test(code)
  const hasOnlySequential = /nn\.Sequential\s*\(/.test(code) &&
    !/def\s+forward\s*\(self/.test(code)
  if (hasCustomModule && !hasOnlySequential) {
    score -= 0.2
  }

  
  const allLiteralArgs = /nn\.\w+\s*\([\d\s,\.]+\)/g
  const literalMatches = code.match(allLiteralArgs) || []
  if (literalMatches.length > 0 && literalMatches.length === varArgMatches.length + literalMatches.length) {
    score += 0.2
  }

  
  if (hasOnlySequential) {
    score += 0.3
  }

 
  const forwardBody = code.match(/def\s+forward\s*\(self[^)]*\)\s*:([\s\S]*?)(?=\n\s{0,4}def\s|\n\s{0,4}class\s|$)/)?.[1] || ''
  const forwardComplexity = (forwardBody.match(/\b(if|for|while|try)\b/g) || []).length
  if (forwardComplexity === 0) {
    score += 0.1
  }

 
  const { nodes = [] } = parseResult
  const unknownCount = nodes.filter(n => n.type === 'Unknown').length
  const totalLayerNodes = nodes.filter(n => n.type !== 'Input').length
  if (totalLayerNodes > 0 && unknownCount === 0) {
    score += 0.2
  }

  return Math.max(0.0, Math.min(1.0, score))
}


export function parseWithFallback(codeString, threshold = 0.6) {
  const result = parseCode(codeString)
  const confidence = computeConfidence(codeString, result)
  const needsCLI = confidence < threshold

  return {
    ...result,
    confidence,
    needsCLI,
  }
}