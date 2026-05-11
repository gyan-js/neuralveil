

function stripNoise(code) {
    let c = code.replace(/"""[\s\S]*?"""/g, '').replace(/'''[\s\S]*?'''/g, '')
    c = c.replace(/:\s*[\w\[\],\s.]+(?=\s*[,)=])/g, '')
    c = c.replace(/#[^\n]*/g, '')
    return c
  }
  
  function extractArgString(callStr) {
    const open = callStr.indexOf('(')
    if (open === -1) return ''
    let depth = 0, close = -1
    for (let i = open; i < callStr.length; i++) {
      if (callStr[i] === '(') depth++
      else if (callStr[i] === ')') { depth--; if (depth === 0) { close = i; break } }
    }
    return close === -1 ? callStr.slice(open + 1) : callStr.slice(open + 1, close)
  }
  
  function splitArgs(argStr) {
    const args = []
    let depth = 0, current = ''
    for (const ch of argStr) {
      if ('([{'.includes(ch)) { depth++; current += ch }
      else if (')]}'.includes(ch)) { depth--; current += ch }
      else if (ch === ',' && depth === 0) { args.push(current.trim()); current = '' }
      else { current += ch }
    }
    if (current.trim()) args.push(current.trim())
    return args
  }
  
  export function extractLayerArgs(argStr) {
    const tokens = splitArgs(argStr)
    const positional = [], kwargs = {}
    for (const t of tokens) {
      const eq = t.indexOf('=')
      if (eq !== -1) {
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
    // Handle tuple/list as first element e.g. kernel_size=(3,3) → 3
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
      c.includes('torch.nn') || c.includes('f.relu') || c.includes('torch.cat')
    const tf = c.includes('import tensorflow') || c.includes('from tensorflow') ||
      c.includes('keras') || c.includes('tf.keras') || c.includes('layers.conv2d') ||
      c.includes('model.add') || c.includes('layers.dense')
    if (torch && !tf) return 'pytorch'
    if (tf && !torch) return 'tensorflow'
    if (torch && tf) return 'pytorch'
    return 'unknown'
  }
  
  
  
  function parsePyTorchLayerCall(s, warnings) {
    const w = warnings
  

    if (s.match(/nn\.Conv2d\s*\(/)) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      return {
        layerType: 'Conv2D',
        config: {
          filters:    resolveNum(k.out_channels  ?? p[1], 64,  w, 'Conv2D'),
          kernelSize: resolveNum(k.kernel_size    ?? p[2], 3,   w, 'Conv2D'),
          stride:     resolveNum(k.stride         ?? p[3], 1,   w, 'Conv2D'),
          padding:    resolveNum(k.padding        ?? p[4], 0,   w, 'Conv2D'),
          dilation:   resolveNum(k.dilation       ?? p[5], 1,   w, 'Conv2D'),
          _inChannels: resolveNum(k.in_channels   ?? p[0], null, w, 'Conv2D'),
        }
      }
    }
  
    if (s.match(/nn\.ConvTranspose2d\s*\(/)) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      return {
        layerType: 'ConvTranspose2D',
        config: {
          filters:    resolveNum(k.out_channels  ?? p[1], 64, w, 'ConvTranspose2D'),
          kernelSize: resolveNum(k.kernel_size   ?? p[2], 2,  w, 'ConvTranspose2D'),
          stride:     resolveNum(k.stride        ?? p[3], 2,  w, 'ConvTranspose2D'),
          padding:    resolveNum(k.padding       ?? p[4], 0,  w, 'ConvTranspose2D'),
          outputPadding: resolveNum(k.output_padding ?? p[5], 0, w, 'ConvTranspose2D'),
          _inChannels: resolveNum(k.in_channels  ?? p[0], null, w, 'ConvTranspose2D'),
        }
      }
    }
  
    // ── Linear ──
    if (s.match(/nn\.Linear\s*\(/)) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      return {
        layerType: 'Dense',
        config: {
          units:      resolveNum(k.out_features ?? p[1], 256, w, 'Dense'),
          _inFeatures: resolveNum(k.in_features ?? p[0], null, w, 'Dense'),
        }
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
  
    if (s.match(/nn\.AdaptiveAvgPool2d\s*\(/)) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      const out = k.output_size ?? p[0] ?? '1'
      const size = resolveNum(out.replace(/[()]/g, '').split(',')[0], 1, w, 'AdaptiveAvgPool')
      return { layerType: 'AdaptiveAvgPool', config: { outputSize: size } }
    }
  
   
    if (s.match(/nn\.AdaptiveAvgPool2d\s*\(\s*(?:1|\(1\s*,\s*1\))\s*\)/)) {
      return { layerType: 'GlobalAvgPool', config: {} }
    }
  
   
    if (s.match(/nn\.BatchNorm2d\s*\(/)) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
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
      const numGroups = resolveNum(k.num_groups ?? p[0], 8, w, 'GroupNorm')
      return { layerType: 'GroupNorm', config: { numGroups } }
    }
  

    if (s.match(/nn\.Dropout2d?\s*\(/)) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      return { layerType: 'Dropout', config: { p: resolveNum(k.p ?? p[0], 0.5, w, 'Dropout') } }
    }
  
    if (s.match(/nn\.Flatten\s*\(/)) {
      const { kwargs: k } = extractLayerArgs(extractArgString(s))
      const startDim = resolveNum(k.start_dim, 1, w, 'Flatten')
      return { layerType: 'Flatten', config: { startDim } }
    }
  
    if (s.match(/nn\.Upsample\s*\(/)) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      const scale = resolveNum(k.scale_factor ?? p[0], 2, w, 'Upsample')
      const mode = (k.mode ?? "'nearest'").replace(/['"]/g, '')
      return { layerType: 'Upsample', config: { scaleFactor: scale, mode } }
    }

    if (s.match(/nn\.MultiheadAttention\s*\(/)) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      return {
        layerType: 'MultiHeadAttention',
        config: {
          embed_dim:  resolveNum(k.embed_dim ?? p[0], 512, w, 'MHA'),
          num_heads:  resolveNum(k.num_heads ?? p[1], 8,   w, 'MHA'),
          dropout:    resolveNum(k.dropout,            0.1, w, 'MHA'),
        }
      }
    }
  
    if (s.match(/nn\.LSTM\s*\(/)) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      return {
        layerType: 'LSTM',
        config: {
          hidden_size:     resolveNum(k.hidden_size ?? p[1], 256, w, 'LSTM'),
          num_layers:      resolveNum(k.num_layers  ?? p[2], 1,   w, 'LSTM'),
          bidirectional:   resolveBool(k.bidirectional, false),
          return_sequences: true,
          _inputSize:      resolveNum(k.input_size  ?? p[0], null, w, 'LSTM'),
        }
      }
    }
  
    if (s.match(/nn\.GRU\s*\(/)) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      return {
        layerType: 'GRU',
        config: {
          hidden_size:     resolveNum(k.hidden_size ?? p[1], 256, w, 'GRU'),
          num_layers:      resolveNum(k.num_layers  ?? p[2], 1,   w, 'GRU'),
          bidirectional:   resolveBool(k.bidirectional, false),
          return_sequences: true,
          _inputSize:      resolveNum(k.input_size  ?? p[0], null, w, 'GRU'),
        }
      }
    }
  
    if (s.match(/nn\.Embedding\s*\(/)) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      return {
        layerType: 'Embedding',
        config: {
          num_embeddings: resolveNum(k.num_embeddings ?? p[0], 10000, w, 'Embedding'),
          embedding_dim:  resolveNum(k.embedding_dim  ?? p[1], 256,   w, 'Embedding'),
        }
      }
    }
  
 
    if (s.match(/nn\.(ReLU|GELU|Sigmoid|Tanh|Softmax|LogSoftmax|LeakyReLU|ELU|SiLU|Mish|Hardswish|PReLU|Identity|SELU)\s*\(/)) {
      return null
    }
  
    return 'unknown'
  }
  

  
  function parseKerasLayerCall(s, warnings) {
    const w = warnings
    const L = /(?:layers\.|tf\.keras\.layers\.|keras\.layers\.)/
  
    if (s.match(new RegExp(L.source + 'Conv2D\\s*\\('))) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      const padStr = (k.padding ?? '').replace(/['"]/g, '').toLowerCase()
      return { layerType: 'Conv2D', config: { filters: resolveNum(k.filters ?? p[0], 64, w, 'Conv2D'), kernelSize: resolveNum(k.kernel_size ?? p[1], 3, w, 'Conv2D'), stride: resolveNum(k.strides ?? p[2], 1, w, 'Conv2D'), padding: padStr === 'same' ? 1 : 0, dilation: 1 } }
    }
  
    if (s.match(new RegExp(L.source + 'Conv2DTranspose\\s*\\('))) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      return { layerType: 'ConvTranspose2D', config: { filters: resolveNum(k.filters ?? p[0], 64, w, 'ConvTranspose2D'), kernelSize: resolveNum(k.kernel_size ?? p[1], 2, w, 'ConvTranspose2D'), stride: resolveNum(k.strides ?? p[2], 2, w, 'ConvTranspose2D'), padding: 0, outputPadding: 0 } }
    }
  
    if (s.match(new RegExp(L.source + 'Dense\\s*\\('))) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      return { layerType: 'Dense', config: { units: resolveNum(k.units ?? p[0], 256, w, 'Dense') } }
    }
  
    if (s.match(new RegExp(L.source + 'MaxPooling2D\\s*\\('))) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      const ks = resolveNum(k.pool_size ?? p[0], 2, w, 'MaxPool2D')
      return { layerType: 'MaxPool2D', config: { kernelSize: ks, stride: resolveNum(k.strides ?? p[1], ks, w, 'MaxPool2D'), padding: 0 } }
    }
  
    if (s.match(new RegExp(L.source + 'AveragePooling2D\\s*\\('))) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      const ks = resolveNum(k.pool_size ?? p[0], 2, w, 'AvgPool2D')
      return { layerType: 'AvgPool2D', config: { kernelSize: ks, stride: resolveNum(k.strides ?? p[1], ks, w, 'AvgPool2D'), padding: 0 } }
    }
  
    if (s.match(new RegExp(L.source + 'GlobalAveragePooling2D\\s*\\('))) {
      return { layerType: 'GlobalAvgPool', config: {} }
    }
  
    if (s.match(new RegExp(L.source + 'BatchNormalization\\s*\\('))) {
      return { layerType: 'BatchNorm', config: { eps: 1e-5, momentum: 0.1 } }
    }
  
    if (s.match(new RegExp(L.source + 'LayerNormalization\\s*\\('))) {
      return { layerType: 'LayerNorm', config: {} }
    }
  
    if (s.match(new RegExp(L.source + 'Dropout\\s*\\('))) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      return { layerType: 'Dropout', config: { p: resolveNum(k.rate ?? p[0], 0.5, w, 'Dropout') } }
    }
  
    if (s.match(new RegExp(L.source + 'Flatten\\s*\\('))) {
      return { layerType: 'Flatten', config: {} }
    }
  
    if (s.match(new RegExp(L.source + 'Reshape\\s*\\('))) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      const targetStr = k.target_shape ?? p[0] ?? ''
      const dims = targetStr.replace(/[()[\]]/g, '').split(',').map(x => resolveNum(x.trim(), null, w, 'Reshape')).filter(x => x !== null)
      return { layerType: 'Reshape', config: { targetC: dims[0] ?? 64, targetH: dims[1], targetW: dims[2] } }
    }
  
    if (s.match(new RegExp(L.source + 'MultiHeadAttention\\s*\\('))) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      const num_heads = resolveNum(k.num_heads ?? p[0], 8, w, 'MHA')
      const key_dim   = resolveNum(k.key_dim   ?? p[1], 64, w, 'MHA')
      return { layerType: 'MultiHeadAttention', config: { embed_dim: num_heads * key_dim, num_heads, dropout: 0.1 } }
    }
  
    if (s.match(new RegExp(L.source + '(?:Bidirectional\\s*\\(\\s*' + L.source + ')?LSTM\\s*\\('))) {
      const bidir = s.includes('Bidirectional')
      const inner = bidir ? s.replace(/.*?Bidirectional\s*\(\s*/, '') : s
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(inner))
      return { layerType: 'LSTM', config: { hidden_size: resolveNum(k.units ?? p[0], 256, w, 'LSTM'), num_layers: 1, bidirectional: bidir, return_sequences: resolveBool(k.return_sequences, true) } }
    }
  
    if (s.match(new RegExp(L.source + '(?:Bidirectional\\s*\\(\\s*' + L.source + ')?GRU\\s*\\('))) {
      const bidir = s.includes('Bidirectional')
      const inner = bidir ? s.replace(/.*?Bidirectional\s*\(\s*/, '') : s
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(inner))
      return { layerType: 'GRU', config: { hidden_size: resolveNum(k.units ?? p[0], 256, w, 'GRU'), num_layers: 1, bidirectional: bidir, return_sequences: resolveBool(k.return_sequences, true) } }
    }
  
    if (s.match(new RegExp(L.source + 'Embedding\\s*\\('))) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      return { layerType: 'Embedding', config: { num_embeddings: resolveNum(k.input_dim ?? p[0], 10000, w, 'Embedding'), embedding_dim: resolveNum(k.output_dim ?? p[1], 256, w, 'Embedding') } }
    }
  
    if (s.match(new RegExp(L.source + 'Add\\s*\\('))) return { layerType: 'Merge', config: { mode: 'add' } }
    if (s.match(new RegExp(L.source + 'Concatenate\\s*\\('))) return { layerType: 'Merge', config: { mode: 'concat' } }
  
    if (s.match(new RegExp(L.source + 'UpSampling2D\\s*\\('))) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      const sz = resolveNum((k.size ?? p[0] ?? '2').replace(/[()]/g, '').split(',')[0], 2, w, 'Upsample')
      return { layerType: 'Upsample', config: { scaleFactor: sz, mode: 'nearest' } }
    }
  
    if (s.match(new RegExp(L.source + 'ZeroPadding2D\\s*\\('))) {
      const { positional: p, kwargs: k } = extractLayerArgs(extractArgString(s))
      const pad = resolveNum((k.padding ?? p[0] ?? '1').replace(/[()]/g, '').split(',')[0], 1, w, 'ZeroPad2D')
      return { layerType: 'ZeroPad2D', config: { padding: pad } }
    }
  
    if (s.match(new RegExp(L.source + 'Lambda\\s*\\('))) {
      warnings.push('Lambda layer detected — imported as Unknown (dynamic code).')
      return { layerType: 'Unknown', config: {}, label: 'Lambda' }
    }
  
    if (s.match(new RegExp(L.source + '(?:ReLU|Activation|Softmax|Sigmoid|LeakyReLU|ELU|PReLU|GELU)\\s*\\('))) return null
  
    return 'unknown'
  }
  
  function traceForwardBody(forwardBody, symbolTable, warnings) {
  
    const ops = []
    const lines = forwardBody.split('\n').map(l => l.trim()).filter(Boolean)
  
    for (const line of lines) {
    
      if (/^return\s/.test(line) || /^assert\s/.test(line) || /^print\s/.test(line)) continue
  
    
      const assignMatch = line.match(/^(\w+)\s*=\s*(.+)$/)
      if (!assignMatch) continue
      const [, lhs, rhs] = assignMatch
  
   
      const catMatch = rhs.match(/torch\.cat\s*\(\s*\[([^\]]+)\]\s*(?:,\s*dim\s*=\s*(-?\d+))?\s*\)/)
      if (catMatch) {
        const parents = catMatch[1].split(',').map(v => v.trim()).filter(Boolean)
        const dim = parseInt(catMatch[2] ?? '1')
        ops.push({ varOut: lhs, op: 'cat', parents, dim })
        continue
      }
  

      const addMatch = rhs.match(/^(\w+)\s*\+\s*(\w+)$/)
      if (addMatch) {
        ops.push({ varOut: lhs, op: 'add', parents: [addMatch[1], addMatch[2]] })
        continue
      }
  
 
      const viewMatch = rhs.match(/^(\w+)\.(?:view|reshape)\s*\((.+)\)$/)
      if (viewMatch) {
        const dims = splitArgs(viewMatch[2]).map(d => resolveNum(d, null))
        ops.push({ varOut: lhs, op: 'view', parents: [viewMatch[1]], dims })
        continue
      }
  
      const flattenMatch = rhs.match(/^(\w+)\.flatten\s*\((.*)?\)$/)
      if (flattenMatch) {
        const startDim = resolveNum(splitArgs(flattenMatch[2] || '1')[0], 1)
        ops.push({ varOut: lhs, op: 'flatten', parents: [flattenMatch[1]], startDim })
        continue
      }
  
   
      const permuteMatch = rhs.match(/^(\w+)\.permute\s*\((.+)\)/)
      if (permuteMatch) {
        const perm = splitArgs(permuteMatch[2]).map(d => parseInt(d)).filter(n => !isNaN(n))
        ops.push({ varOut: lhs, op: 'permute', parents: [permuteMatch[1]], permutation: perm })
        continue
      }
  
 
      const squeezeMatch = rhs.match(/^(\w+)\.(squeeze|unsqueeze)\s*\((.*)?\)/)
      if (squeezeMatch) {
        const dim = resolveNum(squeezeMatch[3], null)
        ops.push({ varOut: lhs, op: squeezeMatch[2], parents: [squeezeMatch[1]], dim })
        continue
      }
  
 
      const transposeMatch = rhs.match(/^(\w+)\.transpose\s*\((.+)\)/)
      if (transposeMatch) {
        const [da, db] = splitArgs(transposeMatch[2]).map(d => parseInt(d))
        ops.push({ varOut: lhs, op: 'transpose', parents: [transposeMatch[1]], dims: [da, db] })
        continue
      }
  
    
      const selfCallMatch = rhs.match(/^self\.(\w+)\s*\((.+)\)$/)
      if (selfCallMatch) {
        const attrName = selfCallMatch[1]
        const argStr = selfCallMatch[2]
        const argVars = splitArgs(argStr).map(v => v.trim().split(/[,.\s(]/)[0]).filter(Boolean)
  
        if (symbolTable[attrName]) {
          ops.push({
            varOut: lhs,
            op: 'layer',
            layerAttr: attrName,
            layerDef: symbolTable[attrName],
            parents: [argVars[0]].filter(Boolean),
          })
        } else {
    
          warnings.push(`self.${attrName} called in forward() but not found in __init__ symbol table. It may be a sub-module — adding as Unknown.`)
          ops.push({ varOut: lhs, op: 'unknown', layerAttr: attrName, parents: [argVars[0]].filter(Boolean) })
        }
        continue
      }
  
  
      const mhaTupleMatch = line.match(/^(\w+)\s*,\s*_\s*=\s*self\.(\w+)\s*\((.+)\)$/)
      if (mhaTupleMatch) {
        const [, outVar, attrName, argStr] = mhaTupleMatch
        const argVars = splitArgs(argStr).map(v => v.trim().split(/[.\s(]/)[0]).filter(Boolean)
        if (symbolTable[attrName]) {
          ops.push({ varOut: outVar, op: 'layer', layerAttr: attrName, layerDef: symbolTable[attrName], parents: [argVars[0]] })
        }
        continue
      }
  
      // ─ LSTM/GRU unpack: out, (h, c) = self.lstm(x) ─
      const lstmUnpackMatch = line.match(/^(\w+)\s*,\s*[(_].*=\s*self\.(\w+)\s*\((.+)\)$/)
      if (lstmUnpackMatch) {
        const [, outVar, attrName, argStr] = lstmUnpackMatch
        const argVars = splitArgs(argStr).map(v => v.trim().split(/[.\s(]/)[0]).filter(Boolean)
        if (symbolTable[attrName]) {
          ops.push({ varOut: outVar, op: 'layer', layerAttr: attrName, layerDef: symbolTable[attrName], parents: [argVars[0]] })
        }
        continue
      }
  
    
      if (/^[Ff]\.(?:relu|gelu|sigmoid|tanh|softmax|log_softmax|dropout|leaky_relu|elu|selu|hardswish|mish)\s*\(/.test(rhs)) {
        const fMatch = rhs.match(/^[Ff]\.\w+\s*\((\w+)/)
        if (fMatch) ops.push({ varOut: lhs, op: 'passthrough', parents: [fMatch[1]] })
        continue
      }
  
    
      const meanMatch = rhs.match(/^(\w+)\.(mean|sum|max|min)\s*\(\s*dim\s*=\s*(-?\d+)/)
      if (meanMatch) {
        ops.push({ varOut: lhs, op: 'reduce', parents: [meanMatch[1]], dim: parseInt(meanMatch[3]), keepdim: rhs.includes('keepdim=True') })
        continue
      }
 
      const copyMatch = rhs.match(/^(\w+)$/)
      if (copyMatch && !/^\d/.test(copyMatch[1])) {
        ops.push({ varOut: lhs, op: 'passthrough', parents: [copyMatch[1]] })
      }
    }
  
    return ops
  }
  function buildGraphFromOps(ops, inputNodeId, warnings) {
    const nodes = []
    const edges = []
    const varToNodeId = { x: inputNodeId, input: inputNodeId }
    let yPos = 155
  
    for (const op of ops) {
      const nodeId = uid()
      let layerDef = null
  
      if (op.op === 'layer') {
        layerDef = op.layerDef
      } else if (op.op === 'cat') {
        layerDef = { layerType: 'Merge', config: { mode: 'concat' } }
      } else if (op.op === 'add') {
        layerDef = { layerType: 'Merge', config: { mode: 'add' } }
      } else if (op.op === 'view' || op.op === 'reshape') {
        // Attempt to extract a concrete target shape from dims
        // dims[0] is usually -1 (batch), skip it
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
      } else if (op.op === 'passthrough') {
        // Wire the same node through
        const srcId = op.parents[0] ? (varToNodeId[op.parents[0]] ?? null) : null
        if (srcId) varToNodeId[op.varOut] = srcId
        continue
      } else if (op.op === 'unknown') {
        layerDef = { layerType: 'Unknown', config: {}, label: op.layerAttr }
      } else {
        continue
      }
  
      if (!layerDef) continue
  
      nodes.push({
        id: nodeId,
        type: layerDef.layerType,
        position: { x: 300, y: yPos },
        config: layerDef.config || {},
        _label: layerDef.label,
      })
      yPos += 130
  
      // Wire edges
      const parents = op.parents ?? []
      for (const parentVar of parents) {
        const srcId = varToNodeId[parentVar]
        if (srcId) {
          edges.push({ id: `e-${srcId}-${nodeId}`, source: srcId, target: nodeId })
        }
      }
  
      varToNodeId[op.varOut] = nodeId
    }
  
    return { nodes, edges }
  }
  
 
  
  function buildSequentialGraph(layers, errors, warnings) {
    const nodes = [], edges = []
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
  
  // ─── PYTORCH MAIN PARSER ─────────────────────────────────────────────────────
  
  export function parsePyTorch(codeString) {
    const errors = [], warnings = []
    const code = stripNoise(codeString)

    const seqMatch = code.match(/nn\.Sequential\s*\(([\s\S]*?)\n\s*\)/)
    if (seqMatch) {
      const body = seqMatch[1]
      const callRegex = /nn\.\w+\s*\([^()]*(?:\([^()]*\)[^()]*)*\)/g
      const calls = body.match(callRegex) || []
      const layers = []
      for (const call of calls) {
        const r = parsePyTorchLayerCall(call, warnings)
        if (r === null) continue
        if (r === 'unknown') { warnings.push(`Unsupported layer in Sequential: "${call.slice(0, 30)}"`); continue }
        layers.push(r)
      }
      if (layers.length > 0) return buildSequentialGraph(layers, errors, warnings)
    }
  
    const selfAssignRegex = /self\.(\w+)\s*=\s*(nn\.[A-Za-z0-9_]+\s*\([^;]*?\))\s*(?:\n|$)/g
    const symbolTable = {}
    let m
    while ((m = selfAssignRegex.exec(code)) !== null) {
      const attrName = m[1]
      const callStr  = m[2].trim()
      const r = parsePyTorchLayerCall(callStr, warnings)
      if (r === null) continue // activation
      if (r === 'unknown') {
        const name = callStr.match(/nn\.(\w+)/)?.[1] || attrName
        warnings.push(`Unrecognised layer "nn.${name}" (self.${attrName}) — added as Unknown.`)
        symbolTable[attrName] = { layerType: 'Unknown', config: {}, label: name }
      } else {
        symbolTable[attrName] = r
      }
    }
  
   
    const nestedClasses = [...codeString.matchAll(/class\s+(\w+)\s*\(\s*nn\.Module\s*\)/g)]
      .map(x => x[1])
    const mainClass = nestedClasses[0]
    const subClasses = nestedClasses.slice(1)
    for (const cls of subClasses) {
      warnings.push(`Nested module class "${cls}(nn.Module)" detected. Sub-module calls are treated as passthrough; expand manually.`)
    }
  
    if (Object.keys(symbolTable).length === 0) {
      errors.push('No recognised PyTorch layers found (self.X = nn.Y(...)). Paste a class body with __init__ and forward().')
      return { layers: [], edges: [], inputShape: null, errors, warnings }
    }
  
  
    const fwdMatch = code.match(/def\s+forward\s*\(self[^)]*\)\s*:([\s\S]*?)(?=\n\s{0,4}def\s|\n\s{0,4}class\s|$)/m)
    const forwardBody = fwdMatch ? fwdMatch[1] : ''
  
    if (!forwardBody.trim()) {
      warnings.push('forward() body is empty or could not be extracted — building linear graph from __init__ order.')
      const layers = Object.values(symbolTable).filter(l => l.layerType !== 'Unknown')
      return buildSequentialGraph(layers, errors, warnings)
    }
  
   
    const ops = traceForwardBody(forwardBody, symbolTable, warnings)
  
    if (ops.length === 0) {
    
      warnings.push('forward() trace yielded no ops — building linear graph from __init__ order.')
      const layers = Object.values(symbolTable)
      return buildSequentialGraph(layers, errors, warnings)
    }
  
   
    const inputId = 'input'
    const inputNode = { id: inputId, type: 'Input', position: { x: 300, y: 30 }, config: {} }
    const { nodes, edges } = buildGraphFromOps(ops, inputId, warnings)
  
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
    const varToId = {}
    let yPos = 155
  
    const inputId = 'input'
    nodes.push({ id: inputId, type: 'Input', position: { x: 300, y: 30 }, config: {} })
  
   
    const inputVarMatch = code.match(/(\w+)\s*=\s*(?:tf\.keras\.Input|keras\.Input|Input)\s*\(/)
    const inputVar = inputVarMatch ? inputVarMatch[1] : 'inputs'
    varToId[inputVar] = inputId
  
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
          if (srcId) edges.push({ id: `e-${srcId}-${nodeId}`, source: srcId, target: nodeId })
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
        const srcVars = srcsStr.split(',').map(v => v.trim())
        for (const sv of srcVars) {
          const srcId = varToId[sv]
          if (srcId) edges.push({ id: `e-${srcId}-${nodeId}`, source: srcId, target: nodeId })
        }
        varToId[lhs] = nodeId
        continue
      }
    }
  
    if (nodes.length <= 1) {
      errors.push('No recognised Keras/TF layers found. Paste a model using layers.X() or model.add() patterns.')
      return { layers: [], edges: [], inputShape: null, errors, warnings }
    }
  
    return { layers: nodes, edges, inputShape: null, errors, warnings }
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
      if (dims.length === 3) return [1, dims[2], dims[0], dims[1]] // HWC → NCHW
      if (dims.length === 2) return [1, dims[1], dims[0]]          // seq NHWC
    }
  
    return null
  }
  
  function runDiagnosticPass(nodes, edges, warnings) {
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))
    const childrenOf = {}
    const parentsOf = {}
    for (const n of nodes) { childrenOf[n.id] = []; parentsOf[n.id] = [] }
    for (const e of edges) {
      childrenOf[e.source]?.push(e.target)
      parentsOf[e.target]?.push(e.source)
    }
  
    for (const node of nodes) {
      const type = node.type
      const parents = parentsOf[node.id] ?? []
      const parentNode = parents[0] ? nodeMap[parents[0]] : null
      const parentType = parentNode?.type
  
      // Dense after non-flat layer: likely missing Flatten
      if (type === 'Dense' && parentType && !['Flatten', 'Dense', 'Dropout', 'LSTM', 'GRU', 'GlobalAvgPool', 'Embedding', 'LayerNorm', 'Input'].includes(parentType)) {
        warnings.push(`⚠ Dense layer follows ${parentType} — a Flatten or GlobalAvgPool is likely missing. Dense expects 2D input [B, features].`)
      }
  
      // MHA after 2D spatial layer
      if (type === 'MultiHeadAttention' && parentType && ['Conv2D', 'MaxPool2D', 'AvgPool2D', 'BatchNorm'].includes(parentType)) {
        warnings.push(`⚠ MultiHeadAttention follows a spatial layer (${parentType}). Attention expects 3D input [B, seq_len, embed_dim]. Consider adding Flatten or Permute.`)
      }
  
      // Conv2D after Flatten or Dense
      if (type === 'Conv2D' && parentType && ['Flatten', 'Dense'].includes(parentType)) {
        warnings.push(`⚠ Conv2D follows ${parentType}. Conv2D requires 4D input [B, C, H, W] but received flattened/dense output. Check layer ordering.`)
      }
  
      // LSTM after 2D spatial layer without flatten/permute
      if (type === 'LSTM' && parentType && ['Conv2D', 'MaxPool2D', 'AvgPool2D'].includes(parentType)) {
        warnings.push(`⚠ LSTM follows ${parentType}. LSTM expects 3D input [B, seq_len, input_size]. A reshape or flatten may be needed.`)
      }
  
      // Merge with only one parent
      if (type === 'Merge' && parents.length < 2) {
        warnings.push(`⚠ Merge node has only ${parents.length} parent(s) — needs 2. Connect the second branch manually.`)
      }
    }
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