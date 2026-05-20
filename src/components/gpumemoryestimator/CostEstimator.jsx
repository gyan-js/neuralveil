import React, { useState } from 'react'
import useMemoryStore from '../../store/useMemoryStore'

const PROVIDER_COLORS = { lambda: '#7df3b4', runpod: '#5bc8f5', aws: '#f5a623', gcp: '#ea4335' }

export default function CostEstimator() {
  const mode = useMemoryStore(s => s.mode)
  const costResults = useMemoryStore(s => s.costResults)
  const setCostConfig = useMemoryStore(s => s.setCostConfig)
  const costConfig = useMemoryStore(s => s.costConfig)

  const [datasetTokens, setDatasetTokens] = useState(costConfig?.datasetTokens ?? 1e9)
  const [numEpochs, setNumEpochs] = useState(costConfig?.numEpochs ?? 1)
  const [numGPUs, setNumGPUs] = useState(costConfig?.numGPUs ?? 1)

  const handleApply = () => {
    setCostConfig({ datasetTokens: Number(datasetTokens), numEpochs: Number(numEpochs), numGPUs: Number(numGPUs) })
  }

  const fittingGPUs = costResults?.fittingGPUs ?? []
  const time = costResults?.timeEstimate

  return (
    <div style={{ padding: '14px 16px' }}>
    

      {mode !== 'training' && (
        <div style={{ color: 'var(--nf-muted)', fontSize: 11, marginBottom: 10 }}>
          Switch to <strong style={{ color: 'var(--nf-accent)' }}>Training</strong> mode to estimate cloud costs.
        </div>
      )}

      {/* Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
        <label style={labelStyle}>
          <span style={labelTextStyle}>Dataset Tokens</span>
          <input
            type="number" value={datasetTokens} min={1e6} step={1e8}
            onChange={e => setDatasetTokens(e.target.value)}
            style={inputStyle}
            disabled={mode !== 'training'}
          />
        </label>
        <label style={labelStyle}>
          <span style={labelTextStyle}>Epochs</span>
          <input
            type="number" value={numEpochs} min={1} step={1}
            onChange={e => setNumEpochs(e.target.value)}
            style={inputStyle}
            disabled={mode !== 'training'}
          />
        </label>
        <label style={labelStyle}>
          <span style={labelTextStyle}>Num GPUs</span>
          <input
            type="number" value={numGPUs} min={1} step={1}
            onChange={e => setNumGPUs(e.target.value)}
            style={inputStyle}
            disabled={mode !== 'training'}
          />
        </label>
      </div>

      <button onClick={handleApply} disabled={mode !== 'training'} style={btnStyle}>
        Estimate Cost
      </button>

      {/* Time estimate */}
      {time && (
        <div style={{ display: 'flex', gap: 16, marginTop: 12, marginBottom: 8 }}>
          <StatPill label="Est. Hours" value={time.totalHours.toFixed(1) + 'h'} />
          <StatPill label="Steps/Epoch" value={time.stepsPerEpoch.toLocaleString()} />
          <StatPill label="Tokens/sec" value={time.tokensPerSec.toLocaleString()} />
        </div>
      )}

      {/* Cost table */}
      {fittingGPUs.length > 0 && (
        <div style={{ marginTop: 10, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {['Provider', 'GPU', 'VRAM', 'Hourly', 'Est. Total', ''].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fittingGPUs.map((r, i) => (
                <tr key={i} style={{ background: i === 0 ? 'rgba(125,243,180,0.04)' : 'transparent' }}>
                  <td style={{ ...tdStyle, color: PROVIDER_COLORS[r.provider] ?? 'var(--nf-text)' }}>
                    {r.provider.toUpperCase()}
                  </td>
                  <td style={tdStyle}>{r.gpuName}</td>
                  <td style={tdStyle}>{r.vramGB} GB</td>
                  <td style={tdStyle}>${r.hourlyUSD}/hr</td>
                  <td style={{ ...tdStyle, color: i === 0 ? 'var(--nf-accent)' : 'var(--nf-text)', fontWeight: i === 0 ? 700 : 400 }}>
                    ${r.totalCostUSD.toFixed(2)}
                  </td>
                  <td style={tdStyle}>
                    {i === 0 && <span style={{ fontSize: 9, background: 'rgba(125,243,180,0.15)', color: 'var(--nf-accent)', padding: '2px 6px', borderRadius: 2, letterSpacing: '0.06em' }}>CHEAPEST</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 9, color: 'var(--nf-muted)', marginTop: 6, letterSpacing: '0.04em' }}>
            ⚠ Estimates only. Verify current pricing on provider websites.
          </div>
        </div>
      )}

      {mode === 'training' && fittingGPUs.length === 0 && costResults && (
        <div style={{ color: '#ff6b6b', fontSize: 11, marginTop: 10 }}>
          No cloud GPU found with sufficient VRAM. Try reducing batch size or enabling gradient checkpointing.
        </div>
      )}
    </div>
  )
}

function StatPill({ label, value }) {
  return (
    <div style={{ flex: 1, background: 'var(--nf-bg)', border: '1px solid var(--nf-border)', borderRadius: 3, padding: '6px 10px' }}>
      <div style={{ fontSize: 13, color: 'var(--nf-accent)', fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--nf-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{label}</div>
    </div>
  )
}

const labelStyle = { display: 'flex', flexDirection: 'column', gap: 4 }
const labelTextStyle = { fontSize: 9, color: 'var(--nf-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }
const inputStyle = {
  background: 'var(--nf-bg)', border: '1px solid var(--nf-border)', color: 'var(--nf-text)',
  padding: '5px 8px', fontSize: 11, borderRadius: 2, width: '100%',
}
const btnStyle = {
  background: 'transparent', border: '1px solid var(--nf-accent)', color: 'var(--nf-accent)',
  padding: '5px 14px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
  cursor: 'pointer', borderRadius: 2,
}
const thStyle = {
  textAlign: 'left', padding: '5px 8px', fontSize: 9, color: 'var(--nf-muted)',
  textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--nf-border)',
}
const tdStyle = { padding: '5px 8px', fontSize: 11, color: 'var(--nf-text)', borderBottom: '1px solid var(--nf-border)' }