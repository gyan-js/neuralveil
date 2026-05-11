function stripCommentsAndDocstrings(code) {
    // Remove triple-quoted docstrings first
    let cleaned = code.replace(/"""[\s\S]*?"""/g, '').replace(/'''[\s\S]*?'''/g, '')
    // Remove inline # comments
    cleaned = cleaned.replace(/#[^\n]*/g, '')
    return cleaned
  }
  
  function extractArgString(callStr) {
    const open = callStr.indexOf('(')
    if (open === -1) return ''
    let depth = 0
    let close = -1
    for (let i = open; i < callStr.length; i++) {
      if (callStr[i] === '(') depth++
      else if (callStr[i] === ')') {
        depth--
        if (depth === 0) { close = i; break }
      }
    }
    if (close === -1) return callStr.slice(open + 1)
    return callStr.slice(open + 1, close)
  }
  
 
  function splitArgs(argStr) {
    const args = []
    let depth = 0
    let current = ''
    for (const ch of argStr) {
      if (ch === '(' || ch === '[' || ch === '{') { depth++; current += ch }
      else if (ch === ')' || ch === ']' || ch === '}') { depth--; current += ch }
      else if (ch === ',' && depth === 0) { args.push(current.trim()); current = '' }
      else { current += ch }
    }
    if (current.trim()) args.push(current.trim())
    return args
  }
  

  export function extractLayerArgs(argStr) {
    const tokens = splitArgs(argStr)
    const positional = []
    const kwargs = {}
    for (const t of tokens) {
      const eqIdx = t.indexOf('=')
      if (eqIdx !== -1) {
        const key = t.slice(0, eqIdx).trim()
        const val = t.slice(eqIdx + 1).trim()
        kwargs[key] = val
      } else {
        positional.push(t)
      }
    }
    return { positional, kwargs }
  }
  
 
  function resolveNum(token, warnings, layerName) {
    if (token === undefined || token === null) return null
    const s = String(token).trim()
    const n = Number(s)
    if (!isNaN(n) && s !== '') return n
    
    warnings.push(`${layerName}: could not resolve arg "${s}" — using placeholder value.`)
    return null
  }
  

  function resolveBool(token, fallback = false) {
    if (token === undefined) return fallback
    const s = String(token).trim()
    if (s === 'True' || s === 'true') return true
    if (s === 'False' || s === 'false') return false
    return fallback
  }
  
  export function detectFramework(codeString) {
    const code = codeString.toLowerCase()
    const hasTorch = code.includes('import torch') || code.includes('nn.module') || code.includes('nn.sequential') || code.includes('nn.conv2d') || code.includes('nn.linear')
    const hasTF = code.includes('import tensorflow') || code.includes('from tensorflow') || code.includes('keras') || code.includes('tf.keras') || code.includes('layers.conv2d')
    if (hasTorch && !hasTF) return 'pytorch'
    if (hasTF && !hasTorch) return 'tensorflow'
    if (hasTorch && hasTF) return 'pytorch' // prefer torch if both
    return 'unknown'
  }
  
  function parsePyTorchLayerCall(callStr, warnings) {
    const s = callStr.trim()
  

    const conv2dMatch = s.match(/nn\.Conv2d\s*\(/)
    if (conv2dMatch) {
      const args = extractLayerArgs(extractArgString(s))
      const { positional: pos, kwargs } = args
      const inC  = resolveNum(kwargs.in_channels  ?? pos[0], warnings, 'Conv2D') ?? 3
      const outC = resolveNum(kwargs.out_channels  ?? pos[1], warnings, 'Conv2D') ?? 64
      const ks   = resolveNum(kwargs.kernel_size   ?? pos[2], warnings, 'Conv2D') ?? 3
      const st   = resolveNum(kwargs.stride        ?? pos[3], warnings, 'Conv2D') ?? 1
      const pad  = resolveNum(kwargs.padding       ?? pos[4], warnings, 'Conv2D') ?? 0
      const dil  = resolveNum(kwargs.dilation      ?? pos[5], warnings, 'Conv2D') ?? 1
      return { layerType: 'Conv2D', config: { filters: outC, kernelSize: ks, stride: st, padding: pad, dilation: dil, _inChannels: inC } }
    }
  
    const linearMatch = s.match(/nn\.Linear\s*\(/)
    if (linearMatch) {
      const { positional: pos, kwargs } = extractLayerArgs(extractArgString(s))
      const units = resolveNum(kwargs.out_features ?? pos[1], warnings, 'Dense') ?? 256
      return { layerType: 'Dense', config: { units } }
    }
  
    const maxPoolMatch = s.match(/nn\.MaxPool2d\s*\(/)
    if (maxPoolMatch) {
      const { positional: pos, kwargs } = extractLayerArgs(extractArgString(s))
      const ks  = resolveNum(kwargs.kernel_size ?? pos[0], warnings, 'MaxPool2D') ?? 2
      const st  = resolveNum(kwargs.stride      ?? pos[1], warnings, 'MaxPool2D') ?? ks
      const pad = resolveNum(kwargs.padding     ?? pos[2], warnings, 'MaxPool2D') ?? 0
      return { layerType: 'MaxPool2D', config: { kernelSize: ks, stride: st, padding: pad } }
    }
  
   
    if (s.match(/nn\.BatchNorm2d\s*\(/)) {
      const { positional: pos, kwargs } = extractLayerArgs(extractArgString(s))
      const eps = resolveNum(kwargs.eps ?? null, warnings, 'BatchNorm') ?? 1e-5
      const mom = resolveNum(kwargs.momentum ?? null, warnings, 'BatchNorm') ?? 0.1
      return { layerType: 'BatchNorm', config: { eps, momentum: mom } }
    }
  
 
    if (s.match(/nn\.Dropout\s*\(/)) {
      const { positional: pos, kwargs } = extractLayerArgs(extractArgString(s))
      const p = resolveNum(kwargs.p ?? pos[0], warnings, 'Dropout') ?? 0.5
      return { layerType: 'Dropout', config: { p } }
    }
  

    if (s.match(/nn\.Flatten\s*\(/)) {
      return { layerType: 'Flatten', config: {} }
    }
  
   
    if (s.match(/nn\.MultiheadAttention\s*\(/)) {
      const { positional: pos, kwargs } = extractLayerArgs(extractArgString(s))
      const embed_dim = resolveNum(kwargs.embed_dim ?? pos[0], warnings, 'MultiHeadAttention') ?? 512
      const num_heads = resolveNum(kwargs.num_heads ?? pos[1], warnings, 'MultiHeadAttention') ?? 8
      const dropout   = resolveNum(kwargs.dropout   ?? null,   warnings, 'MultiHeadAttention') ?? 0.1
      return { layerType: 'MultiHeadAttention', config: { embed_dim, num_heads, dropout } }
    }
  

    if (s.match(/nn\.LSTM\s*\(/)) {
      const { positional: pos, kwargs } = extractLayerArgs(extractArgString(s))
      const hidden_size   = resolveNum(kwargs.hidden_size   ?? pos[1], warnings, 'LSTM') ?? 256
      const num_layers    = resolveNum(kwargs.num_layers    ?? pos[2], warnings, 'LSTM') ?? 1
      const bidirectional = resolveBool(kwargs.bidirectional, false)
      return { layerType: 'LSTM', config: { hidden_size, num_layers, bidirectional, return_sequences: true } }
    }
  
  
    if (s.match(/nn\.Embedding\s*\(/)) {
      const { positional: pos, kwargs } = extractLayerArgs(extractArgString(s))
      const num_embeddings = resolveNum(kwargs.num_embeddings ?? pos[0], warnings, 'Embedding') ?? 10000
      const embedding_dim  = resolveNum(kwargs.embedding_dim  ?? pos[1], warnings, 'Embedding') ?? 256
      return { layerType: 'Embedding', config: { num_embeddings, embedding_dim } }
    }
  
    
    if (s.match(/nn\.LayerNorm\s*\(/)) {
      return { layerType: 'LayerNorm', config: {} }
    }
  
    
    if (s.match(/nn\.(ReLU|GELU|Sigmoid|Tanh|Softmax|LeakyReLU|ELU|SiLU|Mish|Identity)\s*\(/)) {
      return null 
    }
  
    return 'unknown'
  }
  