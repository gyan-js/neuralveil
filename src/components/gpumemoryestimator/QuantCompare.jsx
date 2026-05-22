import React, { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import useMemoryStore from '../../store/useMemoryStore.js'
import { QUANT_SCHEMES } from '../../engine/quantEngine.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const GPU_COLS = ['A10', 'H100', 'RTX4090', 'V100']
const GPU_VRAM = { A10: 24, H100: 80, RTX4090: 24, V100: 16 }

const SCHEME_LABELS = {
  fp32:      'FP32',
  fp16:      'FP16',
  bf16:      'BF16',
  int8:      'INT8',
  int4_gptq: 'INT4 (GPTQ)',
  int4_awq:  'INT4 (AWQ)',
  nf4_bnb:   'NF4 (bnb)',
}


function fitColor(fits) {
  return fits ? '#00e5a0' : '#f87171'
}


function getUnlockInsight(rows) {
  const fp32Row = rows.find(r => r.scheme === 'fp32')
  if (!fp32Row) return null

  const oomOnAll = GPU_COLS.every(g => !fp32Row.gpuFit[g])
  if (!oomOnAll) return null

  const rtxFit = rows.find(r => r.gpuFit['RTX4090'])
  if (!rtxFit) return null

  return {
    scheme: SCHEME_LABELS[rtxFit.scheme] ?? rtxFit.scheme,
    totalGB: rtxFit.totalGB,
    savedGB: rtxFit.savedGB,
    gpu: 'RTX 4090',
    vram: GPU_VRAM['RTX4090'],
  }
}

export default function QuantCompare() {
  const quantComparisonResults = useMemoryStore(s => s.quantComparisonResults)
  const selectedQuantSchemes   = useMemoryStore(s => s.selectedQuantSchemes)
  const activeQuantScheme      = useMemoryStore(s => s.activeQuantScheme)
  const setActiveQuantScheme   = useMemoryStore(s => s.setActiveQuantScheme)
  const setSelectedQuantSchemes = useMemoryStore(s => s.setSelectedQuantSchemes)

  const rows = useMemo(
    () => quantComparisonResults.filter(r => selectedQuantSchemes.includes(r.scheme)),
    [quantComparisonResults, selectedQuantSchemes],
  )

  const unlockInsight = useMemo(() => getUnlockInsight(quantComparisonResults), [quantComparisonResults])

 
  const chartData = useMemo(() => ({
    labels: rows.map(r => SCHEME_LABELS[r.scheme] ?? r.scheme),
    datasets: [{
      label: 'Total VRAM (GB)',
      data: rows.map(r => r.totalGB),
      backgroundColor: rows.map(r => {
        if (r.scheme === activeQuantScheme) return '#5bc8f5'
        if (r.gpuFit['RTX4090']) return '#00e5a0'
        if (r.gpuFit['A10'] || r.gpuFit['H100']) return '#f59e0b'
        return '#f87171'
      }),
      borderRadius: 3,
      borderSkipped: false,
    }],
  }), [rows, activeQuantScheme])

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.raw.toFixed(2)} GB`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#8899aa', font: { family: 'Space Mono', size: 10 } },
        grid:  { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        ticks: { color: '#c0d0e0', font: { family: 'Space Mono', size: 10 } },
        grid:  { display: false },
      },
    },
  }

 
  const toggleScheme = (scheme) => {
    if (selectedQuantSchemes.includes(scheme)) {
      if (selectedQuantSchemes.length === 1) return // keep at least one
      setSelectedQuantSchemes(selectedQuantSchemes.filter(s => s !== scheme))
    } else {
      setSelectedQuantSchemes([...selectedQuantSchemes, scheme])
    }
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {Object.keys(QUANT_SCHEMES).map(scheme => {
          const active = selectedQuantSchemes.includes(scheme)
          return (
            <button
              key={scheme}
              onClick={() => toggleScheme(scheme)}
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '9px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: '2px',
                border: `1px solid ${active ? '#5bc8f5' : 'rgba(255,255,255,0.12)'}`,
                background: active ? 'rgba(91,200,245,0.1)' : 'transparent',
                color: active ? '#5bc8f5' : '#8899aa',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {SCHEME_LABELS[scheme]}
            </button>
          )
        })}
      </div>

 
      <div style={{ height: `${Math.max(rows.length * 38, 120)}px` }}>
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { color: '#5bc8f5', label: 'Active scheme' },
          { color: '#00e5a0', label: 'Fits RTX4090' },
          { color: '#f59e0b', label: 'Fits A100/H100 only' },
          { color: '#f87171', label: 'OOM on all' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color }} />
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', color: '#8899aa', letterSpacing: '0.06em' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {['Scheme', 'Weight GB', 'Total GB', 'Saved vs FP32', ...GPU_COLS, 'Accuracy Note', ''].map(h => (
                <th key={h} style={{
                  padding: '7px 10px',
                  textAlign: 'left',
                  color: '#8899aa',
                  fontWeight: 400,
                  letterSpacing: '0.08em',
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isCurrent = row.scheme === activeQuantScheme
              return (
                <tr
                  key={row.scheme}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: isCurrent ? 'rgba(91,200,245,0.06)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <td style={{ padding: '8px 10px', color: isCurrent ? '#5bc8f5' : '#c0d0e0', fontWeight: isCurrent ? 700 : 400 }}>
                    {SCHEME_LABELS[row.scheme] ?? row.scheme}
                    {isCurrent && (
                      <span style={{
                        marginLeft: '6px', fontSize: '8px',
                        background: 'rgba(91,200,245,0.2)', color: '#5bc8f5',
                        padding: '1px 5px', borderRadius: '2px',
                      }}>ACTIVE</span>
                    )}
                  </td>

                  <td style={{ padding: '8px 10px', color: '#c0d0e0' }}>{row.weightGB.toFixed(2)}</td>

                  <td style={{ padding: '8px 10px', color: '#c0d0e0', fontWeight: 600 }}>{row.totalGB.toFixed(2)}</td>

                  <td style={{ padding: '8px 10px', color: '#00e5a0' }}>
                    {row.savedGB > 0 ? `−${row.savedGB.toFixed(2)} GB (${row.savedPercent.toFixed(0)}%)` : '—'}
                  </td>

                  {GPU_COLS.map(gpu => (
                    <td key={gpu} style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: fitColor(row.gpuFit[gpu]),
                        boxShadow: row.gpuFit[gpu] ? '0 0 6px #00e5a0' : 'none',
                      }} title={row.gpuFit[gpu] ? `Fits ${gpu}` : `OOM on ${gpu}`} />
                    </td>
                  ))}

                  <td style={{ padding: '8px 10px', color: '#8899aa', fontSize: '10px', maxWidth: '200px' }}>
                    {row.accuracyNote}
                  </td>

                  <td style={{ padding: '8px 10px' }}>
                    <button
                      onClick={() => setActiveQuantScheme(row.scheme)}
                      disabled={isCurrent}
                      style={{
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '8px',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '2px',
                        border: `1px solid ${isCurrent ? 'rgba(91,200,245,0.3)' : 'rgba(255,255,255,0.15)'}`,
                        background: isCurrent ? 'rgba(91,200,245,0.1)' : 'transparent',
                        color: isCurrent ? '#5bc8f5' : '#8899aa',
                        cursor: isCurrent ? 'default' : 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s',
                      }}
                    >
                      {isCurrent ? '✓ In use' : 'Use this'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>


      {unlockInsight && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,229,160,0.08), rgba(0,229,160,0.03))',
          border: '1px solid rgba(0,229,160,0.35)',
          borderLeft: '3px solid #00e5a0',
          borderRadius: '4px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '9px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#00e5a0',
            opacity: 0.7,
          }}>
            ⚡ Quantization Unlock
          </div>
          <div style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '12px',
            color: '#e0f0ff',
            lineHeight: 1.6,
          }}>
            Your model is <strong style={{ color: '#f87171' }}>OOM on all GPUs</strong> in FP32 ({'>'}
            {unlockInsight.vram} GB). Using{' '}
            <strong style={{ color: '#00e5a0' }}>{unlockInsight.scheme}</strong> brings it down to{' '}
            <strong style={{ color: '#00e5a0' }}>{unlockInsight.totalGB.toFixed(2)} GB</strong>, making it fit on a{' '}
            <strong style={{ color: '#5bc8f5' }}>{unlockInsight.gpu}</strong>.
          </div>
          <div style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '10px',
            color: '#8899aa',
          }}>
            Saves {unlockInsight.savedGB.toFixed(2)} GB vs FP32 baseline.
          </div>
        </div>
      )}

    </div>
  )
}