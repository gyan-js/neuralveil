import { useState } from 'react'

function MockScreen({ label, bg, rotate, zIndex, content }) {
  return (
    <div
      style={{
        width: '320px',
        height: '200px',
        backgroundColor: bg || '#111',
        border: '1px solid rgba(232, 101, 10, 0.3)',
        borderRadius: '6px',
        transform: `rotate(${rotate}deg)`,
        position: 'absolute',
        zIndex,
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
 
      <div
        style={{
          height: '28px',
          backgroundColor: 'rgba(232, 101, 10, 0.08)',
          borderBottom: '1px solid rgba(232, 101, 10, 0.15)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          gap: '6px',
        }}
      >
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(232,101,10,0.3)' }} />
        <span className="font-mono-jb" style={{ fontSize: '10px', color: 'var(--ash)' }}>{label}</span>
      </div>
      {content}
    </div>
  )
}

function ShapeFlowContent() {
  const nodes = [
    { label: '[B, 512]', x: 20, y: 40 },
    { label: '[B, 256]', x: 140, y: 40 },
    { label: '[B, 128]', x: 240, y: 40 },
  ]
  return (
    <div style={{ padding: '16px', position: 'relative', height: '100%' }}>
      <div className="font-mono-jb" style={{ fontSize: '9px', color: 'var(--ash)', marginBottom: '16px' }}>
        // tensor shape flow graph
      </div>
      <svg width="280" height="80" style={{ overflow: 'visible' }}>
        {nodes.map((n, i) => (
          <g key={i}>
            <rect x={n.x} y={n.y} width="80" height="22" rx="3"
              fill="rgba(232,101,10,0.1)" stroke="rgba(232,101,10,0.4)" strokeWidth="1" />
            <text x={n.x + 40} y={n.y + 15} textAnchor="middle"
              style={{ fontSize: '9px', fill: '#c8bfb0', fontFamily: 'JetBrains Mono, monospace' }}>
              {n.label}
            </text>
            {i < nodes.length - 1 && (
              <line x1={n.x + 80} y1={n.y + 11} x2={nodes[i+1].x} y2={nodes[i+1].y + 11}
                stroke="var(--ember)" strokeWidth="1" strokeDasharray="3 2" />
            )}
          </g>
        ))}
        <text x="140" y="90" textAnchor="middle"
          style={{ fontSize: '8px', fill: '#ff6b6b', fontFamily: 'JetBrains Mono, monospace' }}>
          ⚠ mismatch at layer 3
        </text>
      </svg>
    </div>
  )
}

function GpuEstimateContent() {
  const bars = [
    { label: 'Weights', pct: 35, color: 'var(--ember)' },
    { label: 'Activations', pct: 28, color: 'var(--flame)' },
    { label: 'Gradients', pct: 22, color: 'var(--ash)' },
    { label: 'Optimizer', pct: 15, color: '#5a4530' },
  ]
  return (
    <div style={{ padding: '14px' }}>
      <div className="font-mono-jb" style={{ fontSize: '9px', color: 'var(--ash)', marginBottom: '12px' }}>
        // vram breakdown: 11.2 GB total
      </div>
      {bars.map((b, i) => (
        <div key={i} style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span className="font-mono-jb" style={{ fontSize: '9px', color: '#8a7560' }}>{b.label}</span>
            <span className="font-mono-jb" style={{ fontSize: '9px', color: 'var(--ember)' }}>{b.pct}%</span>
          </div>
          <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
            <div style={{ width: `${b.pct * 2.4}px`, height: '100%', backgroundColor: b.color, borderRadius: '2px' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function LiveCheckContent() {
  const checks = [
    { ok: true, msg: 'Linear(512→256): ✓' },
    { ok: false, msg: 'Linear(256→512): ✗ expects [B,256]' },
    { ok: true, msg: 'ReLU: ✓' },
  ]
  return (
    <div style={{ padding: '14px' }}>
      <div className="font-mono-jb" style={{ fontSize: '9px', color: 'var(--ash)', marginBottom: '10px' }}>
        // live shape check
      </div>
      {checks.map((c, i) => (
        <div key={i} className="font-mono-jb" style={{
          fontSize: '10px',
          color: c.ok ? '#6bcb77' : '#ff6b6b',
          marginBottom: '6px',
        }}>
          {c.ok ? '● ' : '✕ '}{c.msg}
        </div>
      ))}
    </div>
  )
}

export default function StackedCards({ mirror = false, tool = 'tensor' }) {
  const [hovered, setHovered] = useState(false)

  const cards = tool === 'tensor'
    ? [
        { label: 'shape-flow.nv', rotate: -2, zIndex: 1, bg: '#0e0e12', content: <ShapeFlowContent /> },
        { label: 'live-check.nv', rotate: 1.5, zIndex: 2, bg: '#0d0e0d', content: <LiveCheckContent /> },
        { label: 'mismatch-alert.gif', rotate: 0.5, zIndex: 3, bg: '#0f0d0a', content: <ShapeFlowContent /> },
      ]
    : [
        { label: 'vram-estimate.nv', rotate: -2, zIndex: 1, bg: '#0e0e12', content: <GpuEstimateContent /> },
        { label: 'batch-scan.nv', rotate: 1.5, zIndex: 2, bg: '#0d0e0d', content: <GpuEstimateContent /> },
        { label: 'memory-map.gif', rotate: 0.5, zIndex: 3, bg: '#0f0d0a', content: <GpuEstimateContent /> },
      ]

  const fanPositions = mirror
    ? [
        { x: -40, y: 20, rotate: -6 },
        { x: -10, y: 8, rotate: -2 },
        { x: 20, y: 0, rotate: 1 },
      ]
    : [
        { x: 0, y: 20, rotate: -6 },
        { x: 30, y: 8, rotate: -2 },
        { x: 60, y: 0, rotate: 1 },
      ]

  return (
    <div
      style={{
        position: 'relative',
        width: '380px',
        height: '240px',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {cards.map((card, i) => {
        const fan = fanPositions[i]
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              transform: hovered
                ? `translate(${fan.x}px, ${fan.y}px) rotate(${fan.rotate}deg)`
                : `rotate(${card.rotate}deg)`,
              zIndex: card.zIndex,
              transition: `transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.04}s`,
              boxShadow: hovered
                ? '0 20px 60px rgba(0,0,0,0.7), 0 0 20px rgba(232,101,10,0.15)'
                : '0 12px 40px rgba(0,0,0,0.6)',
              width: '320px',
              height: '200px',
              backgroundColor: card.bg || '#111',
              border: `1px solid ${hovered ? 'rgba(232,101,10,0.5)' : 'rgba(232,101,10,0.3)'}`,
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '28px',
                backgroundColor: 'rgba(232,101,10,0.08)',
                borderBottom: '1px solid rgba(232,101,10,0.15)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                gap: '6px',
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(232,101,10,0.3)' }} />
              <span className="font-mono-jb" style={{ fontSize: '10px', color: 'var(--ash)' }}>{card.label}</span>
            </div>
            {card.content}
          </div>
        )
      })}
    </div>
  )
}
