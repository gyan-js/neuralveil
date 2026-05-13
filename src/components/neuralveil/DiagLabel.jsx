import React from 'react'

export default function DiagLabel({ label, value, color = 'gold', blink = false, className = '' }) {
  const colorMap = {
    gold:  { text: 'var(--gold)',  border: 'rgba(201,168,76,0.25)' },
    ember: { text: 'var(--ember)', border: 'rgba(255,94,26,0.25)' },
    cyan:  { text: 'var(--cyan)',  border: 'rgba(0,229,255,0.25)' },
    dim:   { text: 'var(--text-dim)', border: 'rgba(122,120,112,0.2)' },
  }
  const c = colorMap[color] || colorMap.gold

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 border font-mono-tech text-xs ${className}`}
      style={{ borderColor: c.border, color: c.text, background: 'rgba(5,5,8,0.6)' }}
    >
      {blink && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: c.text }}
        />
      )}
      <span style={{ color: 'var(--text-dim)', fontSize: '0.6rem' }}>{label}</span>
      <span style={{ color: c.text }}>{value}</span>
    </div>
  )
}
