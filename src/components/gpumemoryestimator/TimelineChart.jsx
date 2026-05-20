import React, { useMemo } from 'react'
import useMemoryStore from '../../store/useMemoryStore'
import { buildTimeline } from '../../engine/timelineEngine'

const PHASE_COLORS = ['#5bc8f5', '#7df3b4', '#f5a623', '#ff6b6b', '#a78bfa']
const TRACK_H = 44
const CHART_H = 220
const PAD_LEFT = 52
const PAD_RIGHT = 16
const PAD_TOP = 16
const PAD_BOT = 32

export default function TimelineChart() {
  const results = useMemoryStore(s => s.results)
  const mode = useMemoryStore(s => s.mode)

  const timeline = useMemo(() => {
    if (!results?.totals) return []
    const { weightsGB, activationsGB, gradientsGB, optimizerGB } = results.totals
    return buildTimeline({ weightsGB, activationsGB, gradientsGB, optimizerGB })
  }, [results])

  if (mode !== 'training') {
    return (
      <div style={{ padding: '14px 16px' }}>
        
        <div style={{ fontSize: 11, color: 'var(--nf-muted)' }}>
          Switch to <strong style={{ color: 'var(--nf-accent)' }}>Training</strong> mode to see the training step memory timeline.
        </div>
      </div>
    )
  }

  if (!timeline.length) return null

  const gpuVRAM = results?.recommended?.vramGB ?? null
  const maxMem = Math.max(...timeline.map(t => t.memoryGB), gpuVRAM ?? 0) * 1.15

  const chartW = 600 // SVG internal width (responsive via viewBox)
  const innerW = chartW - PAD_LEFT - PAD_RIGHT
  const innerH = CHART_H - PAD_TOP - PAD_BOT

  const xStep = innerW / (timeline.length - 1)
  const yScale = (gb) => PAD_TOP + innerH - (gb / maxMem) * innerH

  // Build polyline points
  const points = timeline.map((t, i) => `${PAD_LEFT + i * xStep},${yScale(t.memoryGB)}`).join(' ')

  // GPU limit Y
  const gpuY = gpuVRAM ? yScale(gpuVRAM) : null

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="panel-label">// Memory Timeline — Training Step</div>
        {gpuVRAM && (
          <span style={{ fontSize: 9, color: '#ff6b6b', letterSpacing: '0.06em' }}>
            ── GPU LIMIT: {gpuVRAM} GB ({results.recommended?.name})
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${chartW} ${CHART_H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const gb = frac * maxMem
          const y = yScale(gb)
          return (
            <g key={frac}>
              <line x1={PAD_LEFT} x2={chartW - PAD_RIGHT} y1={y} y2={y}
                stroke="var(--nf-border)" strokeWidth={0.5} strokeDasharray="3,3" />
              <text x={PAD_LEFT - 4} y={y + 3.5} textAnchor="end"
                fill="var(--nf-muted)" fontSize={8.5}>{gb.toFixed(1)}</text>
            </g>
          )
        })}

        {/* GPU limit line */}
        {gpuY && (
          <>
            <line x1={PAD_LEFT} x2={chartW - PAD_RIGHT} y1={gpuY} y2={gpuY}
              stroke="#ff6b6b" strokeWidth={1} strokeDasharray="5,3" />
            {/* Danger zone fill */}
            {timeline.some(t => t.memoryGB > gpuVRAM) && (
              <clipPath id="overLimit">
                <rect x={PAD_LEFT} y={PAD_TOP} width={innerW} height={gpuY - PAD_TOP} />
              </clipPath>
            )}
          </>
        )}

        {/* Area fill under curve */}
        <defs>
          <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--nf-accent)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--nf-accent)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <polygon
          points={[
            `${PAD_LEFT},${PAD_TOP + innerH}`,
            ...timeline.map((t, i) => `${PAD_LEFT + i * xStep},${yScale(t.memoryGB)}`),
            `${PAD_LEFT + (timeline.length - 1) * xStep},${PAD_TOP + innerH}`,
          ].join(' ')}
          fill="url(#timelineGrad)"
        />

        {/* Line */}
        <polyline points={points}
          fill="none" stroke="var(--nf-accent)" strokeWidth={1.5}
          strokeLinejoin="round" strokeLinecap="round" />

        {/* Data points + labels */}
        {timeline.map((t, i) => {
          const cx = PAD_LEFT + i * xStep
          const cy = yScale(t.memoryGB)
          const overLimit = gpuVRAM && t.memoryGB > gpuVRAM
          const color = overLimit ? '#ff6b6b' : PHASE_COLORS[i]
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={4} fill={color} stroke="var(--nf-surface)" strokeWidth={1.5} />
              {/* Value label */}
              <text x={cx} y={cy - 8} textAnchor="middle" fill={color} fontSize={9} fontWeight={600}>
                {t.memoryGB.toFixed(2)}
              </text>
              {/* X axis label */}
              <text x={cx} y={CHART_H - PAD_BOT + 14} textAnchor="middle" fill="var(--nf-muted)" fontSize={8.5}>
                {t.label}
              </text>
            </g>
          )
        })}

        {/* Y axis label */}
        <text transform={`rotate(-90) translate(${-(CHART_H / 2)}, 11)`}
          textAnchor="middle" fill="var(--nf-muted)" fontSize={8.5} letterSpacing="0.06em">
          VRAM (GB)
        </text>
      </svg>

      {/* Phase description strip */}
      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        {timeline.map((t, i) => (
          <div key={i} style={{ flex: 1, padding: '4px 6px', background: 'var(--nf-bg)', borderRadius: 2, borderLeft: `2px solid ${PHASE_COLORS[i]}` }}>
            <div style={{ fontSize: 9, color: PHASE_COLORS[i], fontWeight: 600, letterSpacing: '0.04em' }}>{t.label}</div>
            <div style={{ fontSize: 8.5, color: 'var(--nf-muted)', marginTop: 2, lineHeight: 1.3 }}>{t.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}