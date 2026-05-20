import React, { useState, useMemo } from 'react'
import useMemoryStore from '../../store/useMemoryStore.js'
import '../../styles/gpu.css'

const COLUMNS = [
  { key: 'index',      label: '#',            numeric: true  },
  { key: 'type',       label: 'Layer Type',   numeric: false },
  { key: 'config',     label: 'Config',       numeric: false },
  { key: 'params',     label: 'Params',       numeric: true  },
  { key: 'weightsMem', label: 'Weights (GB)', numeric: true  },
  { key: 'activMem',   label: 'Activ (GB)',   numeric: true  },
  { key: 'totalMem',   label: 'Total (GB)',   numeric: true  },
]

export default function LayerTable() {
  const layers  = useMemoryStore((s) => s.layers)
  const results = useMemoryStore((s) => s.results)

  const [sortKey, setSortKey] = useState('totalMem')
  const [sortDir, setSortDir] = useState('desc')

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const rows = useMemo(() => {
    if (!results || !layers.length) return []

    const perLayerWeights = results.weights?.perLayer ?? results.perLayerWeights ?? []
    const perLayerActiv   = results.activations?.perLayer ?? results.perLayerActivations ?? []

    const weightMap = Object.fromEntries(perLayerWeights.map((r) => [r.layerId ?? r.id, r]))
    const activMap  = Object.fromEntries(perLayerActiv.map((r)  => [r.layerId ?? r.id, r]))

    return layers.map((layer, idx) => {
      const w = weightMap[layer.id]
      const a = activMap[layer.id]
      const weightsMem = w?.memGB ?? w?.memoryGB ?? 0
      const activMem   = a?.memGB ?? a?.memoryGB ?? 0
      const totalMem   = weightsMem + activMem
      const params     = w?.params ?? 0

      const config = [
        layer.units,
        layer.output && layer.output !== layer.units ? `→${layer.output}` : null,
        layer.seqLen > 1 ? `seq:${layer.seqLen}` : null,
      ].filter(Boolean).join(' ')

      return { index: idx + 1, layerId: layer.id, type: layer.type, config, params, weightsMem, activMem, totalMem }
    })
  }, [layers, results])

  const maxTotalMem = useMemo(() => Math.max(...rows.map((r) => r.totalMem), 0), [rows])

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
  }, [rows, sortKey, sortDir])

  function fmtGB(val) {
    if (val === 0) return '0.0000'
    if (val < 0.00005) return val.toExponential(2)
    return val.toFixed(4)
  }

  const SortArrow = ({ col }) => {
    if (sortKey !== col) return <span className="sort-arrow inactive">↕</span>
    return <span className="sort-arrow active">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  if (!layers.length) {
    return (
      <div className="lt-wrap">
       
        <div className="text-[11px]">Add layers to see per-layer breakdown</div>
      </div>
    )
  }

  return (
    <div className="lt-wrap">
      <div className="lt-head">
      
        <span className="lt-count">{rows.length} layers</span>
      </div>
      <div className="lt-scroll">
        <table className="lt-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={col.numeric ? 'th-num' : ''}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label} <SortArrow col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const isMax = row.totalMem === maxTotalMem && maxTotalMem > 0
              return (
                <tr key={row.layerId} className={isMax ? 'row-max' : ''}>
                  <td className="td-num td-muted">{row.index}</td>
                  <td className="td-type">{row.type}</td>
                  <td className="td-cfg">{row.config}</td>
                  <td className="td-num">{row.params.toLocaleString()}</td>
                  <td className="td-num">{fmtGB(row.weightsMem)}</td>
                  <td className="td-num">{fmtGB(row.activMem)}</td>
                  <td className="td-num td-total">
                    {fmtGB(row.totalMem)}
                    {isMax && <span className="peak-badge">peak</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        .lt-wrap { overflow: hidden; display: flex; flex-direction: column; height: 100%; }
        .lt-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          border-bottom: 1px solid var(--nf-border);
        }
        .lt-count { font-size: 10px; color: var(--nf-muted); letter-spacing: 0.05em; }
        .lt-empty {
          font-size: 11px;
          color: var(--nf-muted);
          text-align: center;
          padding: 20px;
        }
        .lt-scroll { overflow-x: auto; overflow-y: auto; flex: 1; min-height: 0; }
        .lt-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          font-family: 'Space Mono', monospace;
        }
        .lt-table th {
          text-align: left;
          padding: 8px 14px;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--nf-muted);
          border-bottom: 1px solid var(--nf-border);
          font-weight: 400;
          cursor: pointer;
          white-space: nowrap;
          user-select: none;
          transition: color 0.15s;
        }
        .lt-table th:hover { color: var(--nf-text); }
        .lt-table th.th-num { text-align: right; }
        .lt-table td {
          padding: 9px 14px;
          border-bottom: 1px solid var(--nf-border);
          color: var(--nf-text);
        }
        .lt-table tr:last-child td { border-bottom: none; }
        .lt-table tr:hover td { background: rgba(255,255,255,0.02); }
        .row-max td { background: rgba(251,191,36,0.05) !important; }
        .td-num { text-align: right; color: var(--nf-muted); }
        .td-muted { color: var(--nf-muted); }
        .td-type {
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--nf-accent2);
        }
        .td-cfg { color: var(--nf-muted); font-size: 10px; }
        .td-total { color: var(--nf-text) !important; }
        .sort-arrow { margin-left: 4px; font-size: 9px; }
        .sort-arrow.inactive { opacity: 0.3; }
        .sort-arrow.active { color: var(--nf-accent); }
        .peak-badge {
          display: inline-block;
          margin-left: 6px;
          font-size: 7px;
          background: rgba(251,191,36,0.15);
          color: var(--nf-amber);
          border: 1px solid rgba(251,191,36,0.3);
          padding: 1px 5px;
          border-radius: 2px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          vertical-align: middle;
        }
      `}</style>
    </div>
  )
}