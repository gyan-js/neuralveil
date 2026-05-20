import React from 'react'
import useMemoryStore from '../../store/useMemoryStore.js'
import '../../styles/gpu.css'
export default function GPUTable() {
  const results = useMemoryStore((s) => s.results)

  if (!results) {
    return (
      <div className="gpu-table-wrap">
        <div className="panel-label" style={{ padding: '10px 14px 0' }}>// GPU Fit Matrix</div>
        <div className="gpu-empty">Add layers to see GPU fit analysis</div>
      </div>
    )
  }

  const { gpuFit, totals, recommended } = results

  return (
    <div className="gpu-table-wrap">
      <div className="gpu-table-head">
       
        <span className="gpu-total-label">Required: {totals.total.toFixed(2)} GB</span>
      </div>
      <table className="gpu-table">
        <thead>
          <tr>
            <th>GPU</th>
            <th>VRAM</th>
            <th>Required</th>
            <th>Margin</th>
            <th>Fits?</th>
          </tr>
        </thead>
        <tbody>
          {gpuFit.map((gpu) => (
            <tr key={gpu.name} className={gpu.fits ? 'row-fit' : 'row-no'}>
              <td>
                <span className="gpu-name">{gpu.name}</span>
                {recommended && gpu.name === recommended.name && (
                  <span className="gpu-rec-badge">Recommended</span>
                )}
              </td>
              <td className="td-num">{gpu.vramGB} GB</td>
              <td className="td-num">{totals.total.toFixed(2)} GB</td>
              <td className={`td-num ${gpu.fits ? 'td-pos' : 'td-neg'}`}>
                {gpu.fits ? '+' : ''}{gpu.marginGB.toFixed(2)} GB
              </td>
              <td>
                <span className={`fit-badge ${gpu.fits ? 'yes' : 'no'}`}>
                  {gpu.fits ? '✓ YES' : '✗ NO'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        .gpu-table-wrap {
          overflow: hidden;
        }
        .gpu-table-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          border-bottom: 1px solid var(--nf-border);
        }
        .gpu-total-label {
          font-size: 10px;
          color: var(--nf-muted);
          letter-spacing: 0.05em;
        }
        .gpu-empty {
          font-size: 11px;
          color: var(--nf-muted);
          text-align: center;
          padding: 20px;
        }
        .gpu-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          font-family: 'Space Mono', monospace;
        }
        .gpu-table th {
          text-align: left;
          padding: 8px 14px;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--nf-muted);
          border-bottom: 1px solid var(--nf-border);
          font-weight: 400;
        }
        .gpu-table td {
          padding: 9px 14px;
          border-bottom: 1px solid var(--nf-border);
          color: var(--nf-text);
        }
        .gpu-table tr:last-child td { border-bottom: none; }
        .row-fit td { background: rgba(0,229,160,0.04); }
        .row-no td { background: rgba(255,61,106,0.04); }
        .gpu-name { margin-right: 6px; }
        .gpu-rec-badge {
          font-size: 8px;
          background: rgba(0,184,255,0.12);
          color: var(--nf-accent2);
          border: 1px solid rgba(0,184,255,0.25);
          padding: 1px 6px;
          border-radius: 2px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          vertical-align: middle;
        }
        .td-num { color: var(--nf-muted); }
        .td-pos { color: var(--nf-accent) !important; }
        .td-neg { color: var(--nf-red) !important; }
      `}</style>
    </div>
  )
}