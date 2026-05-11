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
  
  function detectSkipConnections(forwardBody) {
    const skips = []
  
    const addPatterns = [...forwardBody.matchAll(/(\w+)\s*=\s*(\w+)\s*\+\s*(\w+)/g)]
    for (const m of addPatterns) {
      skips.push({ type: 'add', varNames: [m[2], m[3]], assignTo: m[1] })
    }
  

    const catPatterns = [...forwardBody.matchAll(/torch\.cat\s*\(\s*\[([^\]]+)\]/g)]
    for (const m of catPatterns) {
      const vars = m[1].split(',').map(v => v.trim()).filter(Boolean)
      skips.push({ type: 'concat', varNames: vars })
    }
  
    return skips
  }
  
  export function parsePyTorch(codeString) {
    const errors = []
    const warnings = []
    const layers = []
  
    const code = stripCommentsAndDocstrings(codeString)
  

    const seqMatch = code.match(/nn\.Sequential\s*\(([\s\S]*?)\)(?=\s*$|\s*\n|\s*#|\s*self)/m)
    if (seqMatch) {
      const body = seqMatch[1]
 
      const layerCallRegex = /nn\.\w+\s*\([^()]*(?:\([^()]*\)[^()]*)*\)/g
      const calls = body.match(layerCallRegex) || []
      for (const call of calls) {
        const result = parsePyTorchLayerCall(call, warnings)
        if (result === null) continue // activation, skip
        if (result === 'unknown') {
          const name = call.match(/nn\.(\w+)/)?.[1] || call
          warnings.push(`Unsupported layer "${name}" — imported as Unknown node.`)
          layers.push({ layerType: 'Unknown', config: {}, label: name })
        } else {
          layers.push(result)
        }
      }
      if (layers.length > 0) {
        return buildSequentialResult(layers, errors, warnings)
      }
    }
  
  
    const selfAssignRegex = /self\.(\w+)\s*=\s*(nn\.\w+\s*\([^;]*?\))\s*(?:\n|$)/g
    const selfLayers = []
    const selfNameMap = {} 
    let m
    while ((m = selfAssignRegex.exec(code)) !== null) {
      const attrName = m[1]
      const callStr  = m[2]
      const result = parsePyTorchLayerCall(callStr, warnings)
      if (result === null) continue
      if (result === 'unknown') {
        const name = callStr.match(/nn\.(\w+)/)?.[1] || attrName
        warnings.push(`Unsupported layer "${name}" (self.${attrName}) — imported as Unknown node.`)
        selfNameMap[attrName] = selfLayers.length
        selfLayers.push({ layerType: 'Unknown', config: {}, label: name })
      } else {
        selfNameMap[attrName] = selfLayers.length
        selfLayers.push({ ...result, _attrName: attrName })
      }
    }
  
   
    const customClassRegex = /class\s+(\w+)\s*\(\s*nn\.Module\s*\)/g
    const knownClass = codeString.match(/class\s+(\w+)\s*\(\s*nn\.Module\s*\)/)?.[1]
    const customClasses = [...codeString.matchAll(/class\s+(\w+)\s*\(\s*nn\.Module\s*\)/g)]
      .map(x => x[1])
      .filter(name => name !== knownClass)
    for (const cls of customClasses) {
      warnings.push(`Custom layer class "${cls}(nn.Module)" detected — imported as Unknown node.`)
      selfLayers.push({ layerType: 'Unknown', config: {}, label: cls })
    }
  
  
    const forwardMatch = code.match(/def\s+forward\s*\(self[^)]*\)\s*:([\s\S]*?)(?=\n\s*def |\n\s*class |\Z|$)/m)
    const forwardBody = forwardMatch ? forwardMatch[1] : ''
  
   
    const skips = detectSkipConnections(forwardBody)
  
    if (selfLayers.length === 0) {
      errors.push('No recognized PyTorch layers found. Paste a class with nn.Module or nn.Sequential.')
      return { layers: [], edges: [], inputShape: null, errors, warnings }
    }

    const forwardCallRegex = /self\.(\w+)\s*\(/g
    const forwardOrder = []
    let fm
    while ((fm = forwardCallRegex.exec(forwardBody)) !== null) {
      const attr = fm[1]
      if (selfNameMap[attr] !== undefined && !forwardOrder.includes(attr)) {
        forwardOrder.push(attr)
      }
    }

    const orderedLayers = []
    const seen = new Set()
    for (const attr of forwardOrder) {
      const idx = selfNameMap[attr]
      if (idx !== undefined && !seen.has(attr)) {
        seen.add(attr)
        orderedLayers.push(selfLayers[idx])
      }
    }

    for (const layer of selfLayers) {
      if (!seen.has(layer._attrName)) {
        if (layer._attrName) {
          warnings.push(`self.${layer._attrName} was defined but not detected in forward() — added at end.`)
        }
        orderedLayers.push(layer)
      }
    }
  

    const mergeInserts = skips.map(sk => ({
      layerType: 'Merge',
      config: { mode: sk.type === 'concat' ? 'concat' : 'add' },
      _isMerge: true,
    }))
  
  
    const finalLayers = [...orderedLayers]
    if (mergeInserts.length > 0 && orderedLayers.length >= 2) {
      const insertAt = Math.floor(orderedLayers.length / 2)
      finalLayers.splice(insertAt + 1, 0, ...mergeInserts.slice(0, 1))
      if (mergeInserts.length > 1) {
        warnings.push(`${mergeInserts.length - 1} additional skip connection(s) detected but could not be auto-positioned — please connect manually.`)
      }
    }
  
    return buildSequentialResult(finalLayers, errors, warnings)
  }

  function parseKerasLayerCall(callStr, warnings) {
    const s = callStr.trim()
  
    // Conv2D
    if (s.match(/(?:layers\.|tf\.keras\.layers\.)Conv2D\s*\(/)) {
      const { positional: pos, kwargs } = extractLayerArgs(extractArgString(s))
      const filters  = resolveNum(kwargs.filters    ?? pos[0], warnings, 'Conv2D') ?? 64
      const ks       = resolveNum(kwargs.kernel_size ?? pos[1], warnings, 'Conv2D') ?? 3
      const st       = resolveNum(kwargs.strides     ?? pos[2], warnings, 'Conv2D') ?? 1
      const padStr   = (kwargs.padding || '').replace(/['"]/g, '').toLowerCase()
      const padding  = padStr === 'same' ? 1 : 0
      return { layerType: 'Conv2D', config: { filters, kernelSize: ks, stride: st, padding, dilation: 1 } }
    }
  
    // Dense
    if (s.match(/(?:layers\.|tf\.keras\.layers\.)Dense\s*\(/)) {
      const { positional: pos, kwargs } = extractLayerArgs(extractArgString(s))
      const units = resolveNum(kwargs.units ?? pos[0], warnings, 'Dense') ?? 256
      return { layerType: 'Dense', config: { units } }
    }
  
    // MaxPooling2D
    if (s.match(/(?:layers\.|tf\.keras\.layers\.)MaxPooling2D\s*\(/)) {
      const { positional: pos, kwargs } = extractLayerArgs(extractArgString(s))
      const ks = resolveNum(kwargs.pool_size ?? pos[0], warnings, 'MaxPool2D') ?? 2
      const st = resolveNum(kwargs.strides   ?? pos[1], warnings, 'MaxPool2D') ?? ks
      return { layerType: 'MaxPool2D', config: { kernelSize: ks, stride: st, padding: 0 } }
    }
  
    // BatchNormalization
    if (s.match(/(?:layers\.|tf\.keras\.layers\.)BatchNormalization\s*\(/)) {
      return { layerType: 'BatchNorm', config: { eps: 1e-5, momentum: 0.1 } }
    }
  
    // Dropout
    if (s.match(/(?:layers\.|tf\.keras\.layers\.)Dropout\s*\(/)) {
      const { positional: pos, kwargs } = extractLayerArgs(extractArgString(s))
      const rate = resolveNum(kwargs.rate ?? pos[0], warnings, 'Dropout') ?? 0.5
      return { layerType: 'Dropout', config: { p: rate } }
    }
  
    // Flatten
    if (s.match(/(?:layers\.|tf\.keras\.layers\.)Flatten\s*\(/)) {
      return { layerType: 'Flatten', config: {} }
    }
  
    // MultiHeadAttention
    if (s.match(/(?:layers\.|tf\.keras\.layers\.)MultiHeadAttention\s*\(/)) {
      const { positional: pos, kwargs } = extractLayerArgs(extractArgString(s))
      const num_heads = resolveNum(kwargs.num_heads ?? pos[0], warnings, 'MultiHeadAttention') ?? 8
      const key_dim   = resolveNum(kwargs.key_dim   ?? pos[1], warnings, 'MultiHeadAttention') ?? 64
      const embed_dim = num_heads * key_dim
      return { layerType: 'MultiHeadAttention', config: { embed_dim, num_heads, dropout: 0.1 } }
    }
  
    // LSTM
    if (s.match(/(?:layers\.|tf\.keras\.layers\.)(?:Bidirectional\s*\(\s*layers\.)?LSTM\s*\(/)) {
      const bidirectional = s.includes('Bidirectional')
   
      const inner = bidirectional ? s.replace(/layers\.Bidirectional\s*\(/, '') : s
      const { positional: pos, kwargs } = extractLayerArgs(extractArgString(inner))
      const hidden_size = resolveNum(kwargs.units ?? pos[0], warnings, 'LSTM') ?? 256
      const ret_seq     = resolveBool(kwargs.return_sequences, true)
      return { layerType: 'LSTM', config: { hidden_size, num_layers: 1, bidirectional, return_sequences: ret_seq } }
    }
  
    // Embedding
    if (s.match(/(?:layers\.|tf\.keras\.layers\.)Embedding\s*\(/)) {
      const { positional: pos, kwargs } = extractLayerArgs(extractArgString(s))
      const num_embeddings = resolveNum(kwargs.input_dim  ?? pos[0], warnings, 'Embedding') ?? 10000
      const embedding_dim  = resolveNum(kwargs.output_dim ?? pos[1], warnings, 'Embedding') ?? 256
      return { layerType: 'Embedding', config: { num_embeddings, embedding_dim } }
    }
  
    // LayerNormalization
    if (s.match(/(?:layers\.|tf\.keras\.layers\.)LayerNormalization\s*\(/)) {
      return { layerType: 'LayerNorm', config: {} }
    }
  
    // Merge: Add
    if (s.match(/(?:layers\.|tf\.keras\.layers\.)Add\s*\(/)) {
      return { layerType: 'Merge', config: { mode: 'add' } }
    }
  
    // Merge: Concatenate
    if (s.match(/(?:layers\.|tf\.keras\.layers\.)Concatenate\s*\(/)) {
      return { layerType: 'Merge', config: { mode: 'concat' } }
    }
  
    // Lambda layers ->  Unknown
    if (s.match(/(?:layers\.|tf\.keras\.layers\.)Lambda\s*\(/)) {
      warnings.push('Lambda layer detected — imported as Unknown node.')
      return { layerType: 'Unknown', config: {}, label: 'Lambda' }
    }
  
    // Activation-only ->  skip
    if (s.match(/(?:layers\.|tf\.keras\.layers\.)(?:ReLU|Activation|Softmax|Sigmoid|LeakyReLU|ELU|PReLU)\s*\(/)) {
      return null
    }
  
    return 'unknown'
  }

  export function parseTensorFlow(codeString) {
    const errors = []
    const warnings = []
    const layers = []
  
    const code = stripCommentsAndDocstrings(codeString)
  
    
    const addRegex = /model\.add\s*\(\s*(.*?)\s*\)/g
    const addMatches = [...code.matchAll(addRegex)]
  
    if (addMatches.length > 0) {
      for (const m of addMatches) {
        const call = m[1]
        const result = parseKerasLayerCall(call, warnings)
        if (result === null) continue
        if (result === 'unknown') {
          const name = call.match(/layers\.(\w+)/)?.[1] || 'Unknown'
          warnings.push(`Unsupported Keras layer "${name}" — imported as Unknown node.`)
          layers.push({ layerType: 'Unknown', config: {}, label: name })
        } else {
          layers.push(result)
        }
      }
      if (layers.length > 0) return buildSequentialResult(layers, errors, warnings)
    }
  

    const funcRegex = /(\w+)\s*=\s*((?:layers\.|tf\.keras\.layers\.)\w+(?:\s*\([^)]*\))?)\s*\(/g

    const lineRegex = /(\w+)\s*=\s*((?:layers\.|tf\.keras\.layers\.)[\w.]+\s*\([^)]*(?:\([^)]*\)[^)]*)*\))\s*(?:\(([^)]*)\))?/g
  
  
    const kerasLayerRegex = /(?:layers\.|tf\.keras\.layers\.)(?:Bidirectional\s*\()?[\w]+\s*\([^;)]*(?:\([^)]*\)[^;)]*)*\)/g
    const kerasCalls = code.match(kerasLayerRegex) || []
  
    for (const call of kerasCalls) {
      const result = parseKerasLayerCall(call, warnings)
      if (result === null) continue
      if (result === 'unknown') {
        const name = call.match(/layers\.(\w+)/)?.[1] || 'Unknown'
        warnings.push(`Unsupported Keras layer "${name}" — imported as Unknown node.`)
        layers.push({ layerType: 'Unknown', config: {}, label: name })
      } else {
        layers.push(result)
      }
    }
  
   
    const addMergeRegex = /layers\.Add\s*\(\)\s*\(\[([^\]]+)\]\)/g
    const catMergeRegex = /layers\.Concatenate[^(]*\(\)[^(]*\(\[([^\]]+)\]\)/g

  
    if (layers.length === 0) {
   
      const seqMatch = code.match(/Sequential\s*\(\s*\[([\s\S]*?)\]\s*\)/)
      if (seqMatch) {
        const body = seqMatch[1]
        const calls = body.match(/(?:layers\.|tf\.keras\.layers\.)\w+\s*\([^)]*\)/g) || []
        for (const call of calls) {
          const result = parseKerasLayerCall(call, warnings)
          if (result === null) continue
          if (result === 'unknown') {
            const name = call.match(/layers\.(\w+)/)?.[1] || 'Unknown'
            warnings.push(`Unsupported Keras layer "${name}" — imported as Unknown node.`)
            layers.push({ layerType: 'Unknown', config: {}, label: name })
          } else {
            layers.push(result)
          }
        }
      }
    }
  
    if (layers.length === 0) {
      errors.push('No recognized Keras/TF layers found. Paste a model using layers.X() or model.add() patterns.')
      return { layers: [], edges: [], inputShape: null, errors, warnings }
    }
  
    return buildSequentialResult(layers, errors, warnings)
  }


  
   let _nodeIdCounter = 1000
  
   function nextId() {
     return `import-${++_nodeIdCounter}`
   }
   
   function buildSequentialResult(layers, errors, warnings) {
     const nodes = []
     const edges = []
   
     // Input node (always present, position 0)
     const inputId = 'input'
     nodes.push({
       id: inputId,
       type: 'Input',
       position: { x: 300, y: 30 },
       config: {},
     })
   
     let prevId = inputId
     let yPos = 155
   
     for (let i = 0; i < layers.length; i++) {
       const layer = layers[i]
       if (!layer || !layer.layerType) continue
   
    
       if (layer.layerType === 'Unknown') {
         // Don't add to graph — already warned
         continue
       }
   
       const id = nextId()
       nodes.push({
         id,
         type: layer.layerType,
         position: { x: 300, y: yPos },
         config: layer.config || {},
       })
   
       edges.push({
         id: `e-${prevId}-${id}`,
         source: prevId,
         target: id,
       })
   
       prevId = id
       yPos += 130
     }
   
     return {
       layers: nodes,  
       edges,
       inputShape: null,
       errors,
       warnings,
     }
   }