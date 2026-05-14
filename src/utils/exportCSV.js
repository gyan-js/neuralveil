export function exportCSV({ layers, results, precision, batchSize, mode }) {
    if (!results || layers.length === 0) return
  
    const { weights, activations, totals } = results
  
    const headers = ['#', 'Type', 'Config', 'Params', 'Weights_GB', 'Activations_GB']
    const rows = [headers.join(',')]
  
    layers.forEach((layer, i) => {
      const w = weights.perLayer[i]
      const a = activations.perLayer[i]
      const config = `${layer.units}→${layer.output || layer.units}${layer.seqLen > 1 ? ` seq:${layer.seqLen}` : ''}`
      rows.push([i + 1, layer.type, `"${config}"`, w.params, w.memGB.toFixed(6), a.memGB.toFixed(6)].join(','))
    })
  
    rows.push('')
    rows.push(`# Config: precision=${precision} batch=${batchSize} mode=${mode}`)
    rows.push(`# Weights Total,${totals.weightsGB.toFixed(4)} GB`)
    rows.push(`# Activations Total,${totals.activationsGB.toFixed(4)} GB`)
    if (mode === 'training') {
      rows.push(`# Gradients Total,${totals.gradientsGB.toFixed(4)} GB`)
      rows.push(`# Optimizer Total,${totals.optimizerGB.toFixed(4)} GB`)
    }
    rows.push(`# Overhead,${totals.overheadGB.toFixed(4)} GB`)
    rows.push(`# TOTAL VRAM,${totals.total.toFixed(4)} GB`)
  
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `gpu_memory_breakdown_${Date.now()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }