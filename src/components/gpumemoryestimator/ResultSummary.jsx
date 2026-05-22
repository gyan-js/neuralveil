import React from 'react'
import useMemoryStore from '../../store/useMemoryStore.js'
import { exportCSV } from '../../utils/exportCSV.js'
import '../../styles/gpu.css'
const COMPONENT_COLORS = {
  weights: '#3266ad',
  activations: '#0ea5e9',
  gradients: '#f97316',
  optimizer: '#ef4444',
  overhead: '#6b7280',
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`stat-card ${accent ? 'stat-card-accent' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

export default function ResultSummary() {
  const layers = useMemoryStore((s) => s.layers)
  const results = useMemoryStore((s) => s.results)
  const precision = useMemoryStore((s) => s.precision)
  const batchSize = useMemoryStore((s) => s.batchSize)
  const mode = useMemoryStore((s) => s.mode)
  const gradientCheckpointing = useMemoryStore((s) => s.gradientCheckpointing)
  const selectedModel = useMemoryStore((s) => s.selectedModel)

  function handleExport() {
    exportCSV({ layers, results, precision, batchSize, mode })
  }

  if (!results) {
    return (
      <div className="result-summary">
        <div className="rs-empty">No data — add layers to begin analysis</div>
      </div>
    )
  }

  const { totals, dominant, recommended, efficiencyScore, gcSavingsGB } = results
  const isTraining = mode === 'training'

  const breakdown = [
    { key: 'weights', label: 'Weights', gb: totals.weightsGB },
    { key: 'activations', label: 'Activations', gb: totals.activationsGB },
    ...(isTraining ? [
      { key: 'gradients', label: 'Gradients', gb: totals.gradientsGB },
      { key: 'optimizer', label: 'Optimizer', gb: totals.optimizerGB },
    ] : []),
    { key: 'overhead', label: 'Overhead', gb: totals.overheadGB },
  ].filter((b) => b.gb > 0)

  const total = totals.total
  const dominantLabel = dominant.charAt(0).toUpperCase() + dominant.slice(1)

  return (
    <div className="result-summary">
      <div className="rs-top">
        <div className="rs-cards">
          <StatCard
            label="Selected Model"
            value={selectedModel ?? 'Custom'}
            sub={selectedModel && selectedModel !== 'Custom' ? mode : 'user-defined'}
            accent={selectedModel !== 'Custom'}
          />
          <StatCard
            label="Total VRAM"
            value={`${total.toFixed(2)} GB`}
            sub={`batch=${batchSize} · ${precision}`}
          />
          <StatCard
            label="Weights"
            value={`${totals.weightsGB.toFixed(2)} GB`}
            sub={`${layers.length} layers`}
          />
          <StatCard
            label="Activations"
            value={`${totals.activationsGB.toFixed(2)} GB`}
            sub="batch × seq × dim"
          />
          <StatCard
            label="Dominant"
            value={dominantLabel}
            sub={recommended ? `→ ${recommended.name}` : 'No GPU fits'}
          />
          <StatCard
            label="Efficiency"
            value={`${efficiencyScore}/100`}
            sub="params per GB · GPU fit"
          />
        </div>

        {gradientCheckpointing && gcSavingsGB > 0 && (
          <div className="gc-callout">
            <span className="gc-icon">⚡</span>
            <span>Gradient checkpointing saves <strong>{gcSavingsGB.toFixed(3)} GB</strong> of activation memory (recomputation cost applies)</span>
          </div>
        )}

        <div className="rs-breakdown">
          {breakdown.map((b) => {
            const pct = total > 0 ? (b.gb / total) * 100 : 0
            return (
              <div key={b.key} className="rs-breakdown-row">
                <div className="rs-bd-label" style={{ color: COMPONENT_COLORS[b.key] }}>
                  {b.label}
                </div>
                <div className="rs-bd-bar-wrap">
                  <div
                    className="rs-bd-bar"
                    style={{ width: `${pct.toFixed(1)}%`, background: COMPONENT_COLORS[b.key] }}
                  />
                </div>
                <div className="rs-bd-val">{b.gb.toFixed(3)} GB</div>
                <div className="rs-bd-pct">({pct.toFixed(0)}%)</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rs-actions">
        <button className="btn-csv" onClick={handleExport} disabled={layers.length === 0}>
          ↓ Export CSV
        </button>
      </div>

      <style>{`
        .result-summary {
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .rs-empty {
          font-size: 11px;
          color: var(--nf-muted);
          text-align: center;
          padding: 20px 0;
        }
        .rs-top { display: flex; flex-direction: column; gap: 14px; }
        .rs-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .stat-card {
          background: var(--nf-surface2);
          border: 1px solid var(--nf-border);
          border-radius: 3px;
          padding: 10px 12px;
        }
        .stat-card-accent { border-color: var(--nf-accent); }
        .stat-label {
          font-size: 8px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--nf-muted);
          margin-bottom: 5px;
        }
        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: clamp(11px, 1.5vw, 18px);
          font-weight: 700;
          color: var(--nf-text);
          line-height: 1.2;
          word-break: break-word;
        }
        .stat-card-accent .stat-value { color: var(--nf-accent); }
        .stat-sub {
          font-size: 9px;
          color: var(--nf-muted);
          margin-top: 4px;
          letter-spacing: 0.04em;
        }
        .rs-breakdown {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .rs-breakdown-row {
          display: grid;
          grid-template-columns: 90px 1fr 70px 42px;
          align-items: center;
          gap: 8px;
          font-size: 10px;
        }
        .rs-bd-label {
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .rs-bd-bar-wrap {
          height: 4px;
          background: var(--nf-surface2);
          border-radius: 2px;
          overflow: hidden;
        }
        .rs-bd-bar {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
          min-width: 2px;
        }
        .rs-bd-val { color: var(--nf-text); text-align: right; }
        .rs-bd-pct { color: var(--nf-muted); }
        .rs-actions { display: flex; justify-content: flex-end; }
        .gc-callout {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          color: var(--nf-accent);
          background: rgba(0,229,160,0.06);
          border: 1px solid rgba(0,229,160,0.2);
          border-radius: 3px;
          padding: 7px 10px;
          letter-spacing: 0.02em;
        }
        .gc-callout strong { color: var(--nf-accent); }
        .gc-icon { font-size: 12px; flex-shrink: 0; }
        .btn-csv {
          background: transparent;
          border: 1px solid var(--nf-border2);
          color: var(--nf-muted);
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-csv:hover:not(:disabled) {
          border-color: var(--nf-accent);
          color: var(--nf-accent);
        }
        .btn-csv:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </div>
  )
}