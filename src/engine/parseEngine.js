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
  
  