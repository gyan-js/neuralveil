
const VALID_CAPTURE_STRATEGIES = new Set(['fx_trace', 'forward_hooks'])

const KNOWN_LAYER_TYPES = new Set([
  'Input', 'Conv2D', 'ConvTranspose2D', 'Conv1D',
  'MaxPool2D', 'AvgPool2D', 'GlobalAvgPool', 'AdaptiveAvgPool', 'AdaptiveMaxPool',
  'BatchNorm', 'LayerNorm', 'GroupNorm', 'InstanceNorm',
  'Dense', 'Flatten', 'Reshape', 'Permute',
  'Upsample', 'ZeroPad2D',
  'LSTM', 'GRU', 'MultiHeadAttention', 'Embedding',
  'Dropout', 'Merge', 'Unknown',
])


export function validateCLISchema(json) {
  const errors = []

  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return ['Root value must be a JSON object.']
  }


  if (json.source !== 'cli_execution') {
    errors.push(
      `"source" must be "cli_execution" (got ${JSON.stringify(json.source)}). ` +
      'Is this a neuralveil_output.json file? Static-parse exports are not accepted here.'
    )
  }


  if (!VALID_CAPTURE_STRATEGIES.has(json.captureStrategy)) {
    errors.push(
      `"captureStrategy" must be one of: ${[...VALID_CAPTURE_STRATEGIES].join(', ')} ` +
      `(got ${JSON.stringify(json.captureStrategy)}).`
    )
  }


  if (!Array.isArray(json.inputShape)) {
    errors.push('"inputShape" must be an array.')
  } else {
    if (json.inputShape.length < 2) {
      errors.push('"inputShape" must have at least 2 dimensions.')
    }
    if (!json.inputShape.every(d => typeof d === 'number' && Number.isInteger(d) && d > 0)) {
      errors.push('"inputShape" must be an array of positive integers.')
    }
  }


  if (!Array.isArray(json.nodes)) {
    errors.push('"nodes" must be an array.')
  } else {
    if (json.nodes.length === 0) {
      errors.push('"nodes" array is empty — no layers found.')
    }
    const nodeIds = new Set()
    json.nodes.forEach((node, i) => {
      const prefix = `nodes[${i}]`
      if (typeof node.id !== 'string' || !node.id) {
        errors.push(`${prefix}: "id" must be a non-empty string.`)
      } else {
        if (nodeIds.has(node.id)) {
          errors.push(`${prefix}: duplicate node id "${node.id}".`)
        }
        nodeIds.add(node.id)
      }
      if (typeof node.type !== 'string') {
        errors.push(`${prefix}: "type" must be a string.`)
      } else if (!KNOWN_LAYER_TYPES.has(node.type)) {
       
        errors.push(`${prefix}: unknown layer type "${node.type}" — may not render correctly.`)
      }
      if (node.config !== undefined && typeof node.config !== 'object') {
        errors.push(`${prefix}: "config" must be an object if present.`)
      }
      if (node.position !== undefined) {
        if (typeof node.position?.x !== 'number' || typeof node.position?.y !== 'number') {
          errors.push(`${prefix}: "position" must be {x: number, y: number}.`)
        }
      }
    })

    // edges
    if (!Array.isArray(json.edges)) {
      errors.push('"edges" must be an array.')
    } else {
      const nodeIdSet = new Set(json.nodes.map(n => n.id))
      json.edges.forEach((edge, i) => {
        const prefix = `edges[${i}]`
        if (typeof edge.source !== 'string') errors.push(`${prefix}: "source" must be a string.`)
        if (typeof edge.target !== 'string') errors.push(`${prefix}: "target" must be a string.`)
        if (edge.source && !nodeIdSet.has(edge.source)) {
          errors.push(`${prefix}: source "${edge.source}" does not reference a known node id.`)
        }
        if (edge.target && !nodeIdSet.has(edge.target)) {
          errors.push(`${prefix}: target "${edge.target}" does not reference a known node id.`)
        }
      })
    }
  }

  return errors
}


export async function loadFromFile(file) {
  if (!(file instanceof File)) {
    throw new ParseError('Expected a File object.')
  }

  if (!file.name.endsWith('.json')) {
    throw new ParseError(
      `File "${file.name}" does not appear to be a JSON file. ` +
      'Drop a neuralveil_output.json file here.'
    )
  }

  if (file.size === 0) {
    throw new ParseError(`File "${file.name}" is empty.`)
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new ParseError(
      `File "${file.name}" exceeds the 2 MB size limit ` +
      `(${(file.size / 1024).toFixed(0)} KB). ` +
      'This file may not be a valid neuralveil_output.json.'
    )
  }

  // Read file text
  const text = await _readFileText(file)

  // Parse JSON
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    throw new ParseError(`"${file.name}" is not valid JSON: ${e.message}`)
  }

  // Validate schema
  const schemaErrors = validateCLISchema(parsed)
  if (schemaErrors.length > 0) {
    // Separate hard errors from type warnings
    const hard = schemaErrors.filter(e => !e.includes('unknown layer type'))
    if (hard.length > 0) {
      throw new ParseError(
        `"${file.name}" failed schema validation:\n` + hard.map(e => `  • ${e}`).join('\n')
      )
    }
  
    parsed._loadWarnings = schemaErrors
  }

  return parsed
}



export function setupDropZone(element, onSuccess, onError) {
  function prevent(e) {
    e.preventDefault()
    e.stopPropagation()
  }

  async function handleDrop(e) {
    prevent(e)
    element.classList.remove('drag-over')

    const files = Array.from(e.dataTransfer?.files ?? [])
    const jsonFile = files.find(f => f.name.endsWith('.json'))

    if (!jsonFile) {
      onError(new ParseError('No .json file found in the dropped items.'))
      return
    }

    try {
      const graph = await loadFromFile(jsonFile)
      onSuccess(graph)
    } catch (err) {
      onError(err instanceof ParseError ? err : new ParseError(String(err)))
    }
  }

  function handleDragOver(e) {
    prevent(e)
    element.classList.add('drag-over')
  }

  function handleDragLeave(e) {
    prevent(e)
    element.classList.remove('drag-over')
  }

  element.addEventListener('dragover',  handleDragOver)
  element.addEventListener('dragleave', handleDragLeave)
  element.addEventListener('drop',      handleDrop)

  return () => {
    element.removeEventListener('dragover',  handleDragOver)
    element.removeEventListener('dragleave', handleDragLeave)
    element.removeEventListener('drop',      handleDrop)
  }
}



export class ParseError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ParseError'
  }
}

function _readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result)
    reader.onerror = () => reject(new ParseError(`Failed to read file "${file.name}".`))
    reader.readAsText(file, 'utf-8')
  })
}