import React, { useState } from 'react'
import useMemoryStore from '../../store/useMemoryStore'
import { buildReportData, generateHTMLReport, exportAsPDF, exportAsCSV } from '../../utils/reportGenerator'

export default function ExportPanel() {
  const [pdfLoading, setPdfLoading] = useState(false)
  const state = useMemoryStore(s => s)

  const hasLayers = state.layers?.length > 0
  const hasResults = !!state.results

  const handleExportPDF = async () => {
    if (!hasResults) return
    setPdfLoading(true)
    try {
      const reportData = buildReportData({
        layers: state.layers,
        batchSize: state.batchSize,
        precision: state.precision,
        mode: state.mode,
        optimizerType: state.optimizerType,
        includeOverhead: state.includeOverhead,
        gradientCheckpointing: state.gradientCheckpointing,
        results: state.results,
        costResults: state.costResults,
        generatedCode: state.generatedCode,
      })
      const html = generateHTMLReport(reportData)
      exportAsPDF(html)
    } finally {
      setTimeout(() => setPdfLoading(false), 1000)
    }
  }

  const handleExportCSV = () => {
    if (!hasResults) return
    exportAsCSV(state.layers, state.results)
  }

  const handleCopyShareURL = async () => {
    await navigator.clipboard.writeText(window.location.href)
      .catch(() => {})
   
  }

  return (
    <div style={{ padding: '14px 16px' }}>
    
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <ExportBtn
          label={pdfLoading ? 'Generating...' : 'Export PDF'}
          accent="var(--nf-accent)"
          disabled={!hasResults || pdfLoading}
          onClick={handleExportPDF}
          icon="⬇"
        />
        <ExportBtn
          label="Export CSV"
          accent="#5bc8f5"
          disabled={!hasResults}
          onClick={handleExportCSV}
          icon="⬇"
        />
        
      </div>
      {!hasResults && (
        <div style={{ fontSize: 10, color: 'var(--nf-muted)', marginTop: 8 }}>
          Add layers to enable export.
        </div>
      )}
    </div>
  )
}

function ExportBtn({ label, accent, disabled, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
 
      style={{
        background: 'transparent',
        border: `1px solid ${disabled ? 'var(--nf-border)' : accent}`,
        color: disabled ? 'var(--nf-muted)' : accent,
        padding: '6px 14px', fontSize: 10, letterSpacing: '0.08em',
        textTransform: 'uppercase', cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 2, display: 'flex', alignItems: 'center', gap: 6,
        opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s',
      }}
    >
      <span>{icon}</span>
      {label}
    </button>
  )
}