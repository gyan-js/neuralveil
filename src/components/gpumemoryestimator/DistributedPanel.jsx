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

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const STRATEGIES = ['DDP', 'FSDP', 'Tensor Parallel', 'Pipeline Parallel']
const GPU_OPTIONS = [1, 2, 4, 8]


const GPU_VRAM_TIERS = {
  'RTX 4090 (24 GB)': 24,
  'A100 (40 GB)': 40,
  'A100 (80 GB)': 80,
  'H100 (80 GB)': 80,
}

const STRATEGY_COLORS = {
  'DDP':               { weights: '#5bc8f5', activations: '#3266ad', comm: '#1a3a5c' },
  'FSDP':              { weights: '#00e5a0', activations: '#00a070', comm: '#005040' },
  'Tensor Parallel':   { weights: '#a78bfa', activations: '#7c5cc4', comm: '#4a3480' },
  'Pipeline Parallel': { weights: '#f59e0b', activations: '#b87000', comm: '#705000' },
}

function StatCard({ label, value, sub, accent = '#5bc8f5' }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid rgba(255,255,255,0.08)`,
      borderTop: `2px solid ${accent}`,
      borderRadius: '4px',
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      minWidth: '130px',
      flex: 1,
    }}>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8899aa' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '18px', fontWeight: 700, color: accent }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', color: '#8899aa' }}>{sub}</div>
      )}
    </div>
  )
}

export default function DistributedPanel() {
  const mode                   = useMemoryStore(s => s.mode)
  const distributedConfig      = useMemoryStore(s => s.distributedConfig)
  const distributedResults     = useMemoryStore(s => s.distributedResults)
  const setNumGPUs             = useMemoryStore(s => s.setNumGPUs)
  const setDistributedStrategy = useMemoryStore(s => s.setDistributedStrategy)

  const { numGPUs, strategy } = distributedConfig

  if (mode !== 'training') {
    return (
      <div style={{
        padding: '32px 16px',
        textAlign: 'center',
        fontFamily: 'Space Mono, monospace',
        fontSize: '11px',
        color: '#8899aa',
        letterSpacing: '0.08em',
      }}>
        Switch to <strong style={{ color: '#f59e0b' }}>Training</strong> mode to use distributed strategy analysis.
      </div>
    )
  }

  if (!distributedResults) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#8899aa', fontFamily: 'Space Mono, monospace', fontSize: '11px' }}>
        No results yet. Add some layers and set Training mode.
      </div>
    )
  }

  const { all, recommended } = distributedResults
  const fsdpResult = distributedResults.fsdp
  const needsTensorParallel = fsdpResult && numGPUs >= 8 && fsdpResult.memPerGPU > 80

  
  const active = all.find(r => r.strategy === strategy) ?? all[0]


  const chartData = useMemo(() => {
    const labels = all.map(r => r.strategy)
    const colors = all.map(r => STRATEGY_COLORS[r.strategy] ?? STRATEGY_COLORS['DDP'])

   
    const getBreakdown = (r) => {
      if (r.strategy === 'FSDP') {
        return {
          weights:     r.shardedGB ?? 0,
          activations: r.activationsGB ?? 0,
          comm:        r.communicationBuffer ?? 0,
        }
      }
      if (r.strategy === 'Pipeline Parallel') {
        return {
          weights:     (r.stageWeights ?? 0) + (r.stageGradients ?? 0) + (r.stageOptimizer ?? 0),
          activations: r.stageActivations ?? 0,
          comm:        0,
        }
      }
     
      const comm = r.communicationOverheadGB ?? r.communicationBuffer ?? 0
      const rest = r.memPerGPU - comm
      return {
        weights:     rest * 0.7,
        activations: rest * 0.3,
        comm,
      }
    }

    return {
      labels,
      datasets: [
        {
          label: 'Weights/Grads/Optimizer',
          data: all.map(r => +getBreakdown(r).weights.toFixed(3)),
          backgroundColor: colors.map(c => c.weights),
          borderRadius: 0,
          borderSkipped: false,
        },
        {
          label: 'Activations',
          data: all.map(r => +getBreakdown(r).activations.toFixed(3)),
          backgroundColor: colors.map(c => c.activations),
          borderRadius: 0,
          borderSkipped: false,
        },
        {
          label: 'Comm. Buffer',
          data: all.map(r => +getBreakdown(r).comm.toFixed(3)),
          backgroundColor: colors.map(c => c.comm),
          borderRadius: 3,
          borderSkipped: false,
        },
      ],
    }
  }, [all])

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#8899aa',
          font: { family: 'Space Mono', size: 9 },
          boxWidth: 10,
          padding: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw.toFixed(2)} GB`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: '#8899aa', font: { family: 'Space Mono', size: 10 } },
        grid:  { color: 'rgba(255,255,255,0.05)' },
        title: { display: true, text: 'GB per GPU', color: '#8899aa', font: { family: 'Space Mono', size: 9 } },
      },
      y: {
        stacked: true,
        ticks: { color: '#c0d0e0', font: { family: 'Space Mono', size: 10 } },
        grid:  { display: false },
      },
    },
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>

        <div style={{ display: 'flex', gap: '6px' }}>
          {STRATEGIES.map(s => {
            const isActive = strategy === s
            const col = STRATEGY_COLORS[s]?.weights ?? '#5bc8f5'
            return (
              <button
                key={s}
                onClick={() => setDistributedStrategy(s)}
                style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '9px',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  padding: '5px 10px',
                  borderRadius: '2px',
                  border: `1px solid ${isActive ? col : 'rgba(255,255,255,0.1)'}`,
                  background: isActive ? `rgba(${hexToRgb(col)},0.12)` : 'transparent',
                  color: isActive ? col : '#8899aa',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {s}
              </button>
            )
          })}
        </div>


        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', color: '#8899aa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            GPUs
          </span>
          {GPU_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setNumGPUs(n)}
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '10px',
                width: '30px',
                height: '28px',
                borderRadius: '2px',
                border: `1px solid ${numGPUs === n ? '#5bc8f5' : 'rgba(255,255,255,0.1)'}`,
                background: numGPUs === n ? 'rgba(91,200,245,0.12)' : 'transparent',
                color: numGPUs === n ? '#5bc8f5' : '#8899aa',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>


      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <StatCard
          label="Strategy"
          value={active.strategy}
          accent={STRATEGY_COLORS[active.strategy]?.weights ?? '#5bc8f5'}
        />
        <StatCard
          label="Mem / GPU"
          value={`${active.memPerGPU.toFixed(2)} GB`}
          sub={`× ${numGPUs} GPU${numGPUs > 1 ? 's' : ''}`}
          accent="#00e5a0"
        />
        <StatCard
          label="Total Mem"
          value={`${active.totalMemAcrossGPUs.toFixed(2)} GB`}
          sub="across all GPUs"
          accent="#a78bfa"
        />
        <StatCard
          label="Comm. Overhead"
          value={`${(active.communicationOverheadGB ?? active.communicationBuffer ?? 0).toFixed(2)} GB`}
          sub="inter-GPU traffic"
          accent="#f59e0b"
        />
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderLeft: `3px solid ${STRATEGY_COLORS[active.strategy]?.weights ?? '#5bc8f5'}`,
        borderRadius: '4px',
        padding: '10px 14px',
        fontFamily: 'Space Mono, monospace',
        fontSize: '11px',
        color: '#c0d0e0',
        lineHeight: 1.7,
      }}>
        {active.notes}
        {active.pipelineBubbleNote && (
          <div style={{ marginTop: '6px', color: '#f59e0b', fontSize: '10px' }}>
            ⚠ {active.pipelineBubbleNote}
          </div>
        )}
      </div>


      <div style={{ height: `${Math.max(all.length * 52, 160)}px` }}>
        <Bar data={chartData} options={chartOptions} />
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Space Mono, monospace', fontSize: '11px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {['Strategy', 'Mem / GPU', 'Total Mem', 'Comm. Overhead'].map(h => (
              <th key={h} style={{
                padding: '7px 10px',
                textAlign: 'left',
                color: '#8899aa',
                fontWeight: 400,
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {all.map(r => {
            const isCurrent = r.strategy === strategy
            const isRecommended = r.strategy === recommended?.strategy
            const col = STRATEGY_COLORS[r.strategy]?.weights ?? '#5bc8f5'
            return (
              <tr
                key={r.strategy}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: isCurrent ? `rgba(${hexToRgb(col)},0.06)` : 'transparent',
                }}
              >
                <td style={{ padding: '8px 10px', color: isCurrent ? col : '#c0d0e0' }}>
                  {r.strategy}
                  {isRecommended && (
                    <span style={{ marginLeft: '6px', fontSize: '8px', background: 'rgba(0,229,160,0.15)', color: '#00e5a0', padding: '1px 5px', borderRadius: '2px' }}>
                      RECOMMENDED
                    </span>
                  )}
                </td>
                <td style={{ padding: '8px 10px', color: '#c0d0e0', fontWeight: isCurrent ? 700 : 400 }}>
                  {r.memPerGPU.toFixed(2)} GB
                </td>
                <td style={{ padding: '8px 10px', color: '#c0d0e0' }}>
                  {r.totalMemAcrossGPUs.toFixed(2)} GB
                </td>
                <td style={{ padding: '8px 10px', color: '#8899aa' }}>
                  {((r.communicationOverheadGB ?? r.communicationBuffer ?? 0)).toFixed(2)} GB
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>


      <div style={{
        background: 'linear-gradient(135deg, rgba(0,229,160,0.07), rgba(0,229,160,0.02))',
        border: '1px solid rgba(0,229,160,0.3)',
        borderLeft: '3px solid #00e5a0',
        borderRadius: '4px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#00e5a0', opacity: 0.7 }}>
          ✦ Strategy Recommendation
        </div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#e0f0ff', lineHeight: 1.6 }}>
          <strong style={{ color: '#00e5a0' }}>{recommended?.strategy ?? '—'}</strong> is the most memory-efficient
          strategy for {numGPUs} GPU{numGPUs > 1 ? 's' : ''} at{' '}
          <strong style={{ color: '#5bc8f5' }}>{recommended?.memPerGPU.toFixed(2)} GB / GPU</strong>.
        </div>
        {recommended?.notes && (
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#8899aa' }}>
            {recommended.notes}
          </div>
        )}
      </div>

      {needsTensorParallel && (
        <div style={{
          background: 'rgba(248,113,113,0.07)',
          border: '1px solid rgba(248,113,113,0.35)',
          borderLeft: '3px solid #f87171',
          borderRadius: '4px',
          padding: '12px 16px',
          fontFamily: 'Space Mono, monospace',
          fontSize: '11px',
          color: '#f87171',
          lineHeight: 1.6,
        }}>
          ⚠ Model doesn't fit even with FSDP on {numGPUs} GPUs.{' '}
          <strong>Requires tensor parallelism or quantization.</strong>
        </div>
      )}

    </div>
  )
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}