export function buildReportData(state) {
    const { layers, batchSize, precision, mode, optimizerType, includeOverhead, gradientCheckpointing, results, costResults, generatedCode } = state
    return {
      meta: {
        generatedAt: new Date().toLocaleString(),
        tool: 'NeuralVeil GPU Memory Estimator',
        version: 'v3.0',
      },
      config: { batchSize, precision, mode, optimizerType, includeOverhead, gradientCheckpointing },
      layers,
      results,
      costResults: costResults ?? null,
      generatedCode: generatedCode ?? [],
    }
  }
  
  export function generateHTMLReport(data) {
    const { meta, config, layers, results, costResults, generatedCode } = data
    const totals = results?.totals
    const gpuFit = results?.gpuFit ?? []
    const fittingGPUs = costResults?.fittingGPUs ?? []
  
    const layerRows = layers.map((l, i) => {
      const w = results?.weights?.perLayer?.find(p => p.layerId === l.id)
      const a = results?.activations?.perLayer?.find(p => p.layerId === l.id)
      return `
        <tr>
          <td>${i + 1}</td>
          <td>${l.type}</td>
          <td>${l.units ?? '—'}</td>
          <td>${w ? w.params.toLocaleString() : '—'}</td>
          <td>${w ? w.memGB.toFixed(4) + ' GB' : '—'}</td>
          <td>${a ? a.memGB.toFixed(4) + ' GB' : '—'}</td>
        </tr>`
    }).join('')
  
    const gpuRows = gpuFit.slice(0, 8).map(g => `
      <tr class="${g.fits ? 'fits' : 'nofits'}">
        <td>${g.name}</td>
        <td>${g.vramGB} GB</td>
        <td>${g.fits ? '✓ Fits' : '✗ OOM'}</td>
        <td>${g.marginGB > 0 ? '+' : ''}${g.marginGB.toFixed(2)} GB</td>
      </tr>`).join('')
  
    const costRows = fittingGPUs.slice(0, 6).map((r, i) => `
      <tr class="${i === 0 ? 'cheapest' : ''}">
        <td>${r.provider.toUpperCase()}</td>
        <td>${r.gpuName}</td>
        <td>${r.vramGB} GB</td>
        <td>$${r.hourlyUSD}/hr</td>
        <td>$${r.totalCostUSD.toFixed(2)}</td>
        ${i === 0 ? '<td>⭐ Cheapest</td>' : '<td></td>'}
      </tr>`).join('')
  
    const codeBlocks = generatedCode.map(b => `
      <div class="code-block">
        <div class="code-label">${b.label}</div>
        <pre><code>${escapeHTML(b.code)}</code></pre>
      </div>`).join('')
  
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8">
  <title>GPU Memory Report — ${meta.generatedAt}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', monospace; background: #0a0a0f; color: #c8d6e5; padding: 32px; font-size: 13px; }
    h1 { font-size: 22px; color: #7df3b4; letter-spacing: 0.1em; margin-bottom: 4px; }
    h2 { font-size: 13px; color: #7df3b4; letter-spacing: 0.12em; text-transform: uppercase; margin: 28px 0 10px; border-bottom: 1px solid #1e2d3d; padding-bottom: 6px; }
    .meta { color: #556; font-size: 11px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 12px; }
    th { background: #111827; color: #7df3b4; text-align: left; padding: 7px 10px; font-weight: 600; letter-spacing: 0.06em; }
    td { padding: 6px 10px; border-bottom: 1px solid #1a2232; color: #c8d6e5; }
    tr.fits td { color: #7df3b4; }
    tr.nofits td { color: #ff6b6b; }
    tr.cheapest td { background: #0d2b1a; color: #7df3b4; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
    .summary-card { background: #111827; border: 1px solid #1e2d3d; border-radius: 4px; padding: 12px; }
    .summary-card .val { font-size: 20px; color: #7df3b4; font-weight: bold; }
    .summary-card .lbl { font-size: 10px; color: #556; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; }
    .code-block { background: #0d1117; border: 1px solid #1e2d3d; border-radius: 4px; margin-bottom: 12px; }
    .code-label { background: #111827; padding: 6px 12px; font-size: 10px; color: #7df3b4; letter-spacing: 0.1em; text-transform: uppercase; }
    pre { padding: 14px; overflow-x: auto; font-size: 11px; line-height: 1.6; color: #c8d6e5; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #1e2d3d; font-size: 10px; color: #334; text-align: center; letter-spacing: 0.06em; }
    @media print {
      body { background: #fff; color: #000; }
      h1, h2, .summary-card .val, tr.fits td, .code-label { color: #1a7a4a; }
      .code-block, .summary-card { border-color: #ccc; }
      pre { background: #f5f5f5; }
      th { background: #e8f5e9; color: #1a7a4a; }
    }
  </style>
  </head>
  <body>
  <h1>// GPU Memory Estimator Report</h1>
  <div class="meta">Generated: ${meta.generatedAt} &nbsp;|&nbsp; ${meta.tool} ${meta.version}</div>
  
  <h2>Memory Summary</h2>
  <div class="summary-grid">
    <div class="summary-card"><div class="val">${totals?.total?.toFixed(2) ?? '—'} GB</div><div class="lbl">Total VRAM</div></div>
    <div class="summary-card"><div class="val">${totals?.weightsGB?.toFixed(2) ?? '—'} GB</div><div class="lbl">Weights</div></div>
    <div class="summary-card"><div class="val">${totals?.activationsGB?.toFixed(2) ?? '—'} GB</div><div class="lbl">Activations</div></div>
    <div class="summary-card"><div class="val">${config.mode}</div><div class="lbl">Mode</div></div>
  </div>
  <table>
    <tr><th>Config</th><th>Value</th></tr>
    <tr><td>Batch Size</td><td>${config.batchSize}</td></tr>
    <tr><td>Precision</td><td>${config.precision}</td></tr>
    <tr><td>Optimizer</td><td>${config.optimizerType}</td></tr>
    <tr><td>Gradient Checkpointing</td><td>${config.gradientCheckpointing ? 'Yes' : 'No'}</td></tr>
    <tr><td>Overhead Included</td><td>${config.includeOverhead ? 'Yes' : 'No'}</td></tr>
  </table>
  
  <h2>Layer Breakdown</h2>
  <table>
    <tr><th>#</th><th>Type</th><th>Units</th><th>Params</th><th>Weight Mem</th><th>Activation Mem</th></tr>
    ${layerRows}
  </table>
  
  <h2>GPU Compatibility</h2>
  <table>
    <tr><th>GPU</th><th>VRAM</th><th>Status</th><th>Margin</th></tr>
    ${gpuRows}
  </table>
  
  ${fittingGPUs.length > 0 ? `
  <h2>Cloud Cost Estimate</h2>
  <table>
    <tr><th>Provider</th><th>GPU</th><th>VRAM</th><th>Hourly Rate</th><th>Est. Total Cost</th><th></th></tr>
    ${costRows}
  </table>
  <p style="font-size:10px;color:#556;margin-top:4px;">⚠ Estimates only. Verify current pricing on provider websites.</p>
  ` : ''}
  
  ${generatedCode.length > 0 ? `
  <h2>PyTorch Config Code</h2>
  ${codeBlocks}
  ` : ''}
  
  <div class="footer">Generated by NeuralVeil GPU Memory Estimator — neuralveil.dev</div>
  </body>
  </html>`
  }
  
  export function exportAsPDF(htmlString) {
    const win = window.open('', '_blank')
    if (!win) { alert('Please allow popups to export PDF.'); return }
    win.document.write(htmlString)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 600)
  }
  
  export function exportAsCSV(layers, results) {
    const perLayer = results?.weights?.perLayer ?? []
    const actLayer = results?.activations?.perLayer ?? []
    const rows = [['#', 'Type', 'Units', 'Params', 'Weight GB', 'Activation GB']]
    layers.forEach((l, i) => {
      const w = perLayer.find(p => p.layerId === l.id)
      const a = actLayer.find(p => p.layerId === l.id)
      rows.push([i + 1, l.type, l.units ?? '', w?.params ?? 0, w?.memGB?.toFixed(6) ?? 0, a?.memGB?.toFixed(6) ?? 0])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'gpu_memory_report.csv'; a.click()
    URL.revokeObjectURL(url)
  }
  
  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }