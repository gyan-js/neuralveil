
import { useGraphStore } from '../store/useGraphStore.js'
import { Cpu, Zap, Clock } from 'lucide-react'

const MODE_CONFIG = {
  static: {
    label: 'Static Parse',
    color: '#00E5FF',
    bg:    'rgba(0,229,255,0.1)',
    border:'rgba(0,229,255,0.3)',
    Icon:  Zap,
  },
  cli: {
    label: 'CLI Verified',
    color: '#a855f7',
    bg:    'rgba(168,85,247,0.12)',
    border:'rgba(168,85,247,0.4)',
    Icon:  Cpu,
  },
  pending: {
    label: 'Pending...',
    color: '#f59e0b',
    bg:    'rgba(245,158,11,0.1)',
    border:'rgba(245,158,11,0.35)',
    Icon:  Clock,
  },
}

export default function ExecutionBadge({ onOpenPanel }) {
  const executionMode    = useGraphStore(s => s.executionMode)
  const parseConfidence  = useGraphStore(s => s.parseConfidence)

  const mode   = MODE_CONFIG[executionMode] ?? MODE_CONFIG.static
  const { label, color, bg, border, Icon } = mode

 
  const showConfidence = executionMode === 'static' && parseConfidence !== null
  const confidencePct  = showConfidence ? Math.round(parseConfidence * 100) : null
  const confidenceColor = parseConfidence !== null
    ? parseConfidence >= 0.8 ? '#39FF14'
      : parseConfidence >= 0.6 ? '#f59e0b'
      : '#FF6B35'
    : color

  return (
    <button
      onClick={onOpenPanel}
      title={`Current parse mode: ${label}. Click to open Execution Panel.`}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            6,
        padding:        '4px 10px',
        background:     bg,
        border:         `1px solid ${border}`,
        borderRadius:   6,
        cursor:         'pointer',
        outline:        'none',
        transition:     'all 0.2s ease',
        animation:      executionMode === 'pending' ? 'badge-pulse 1.4s ease-in-out infinite' : 'none',
      }}
    >
      <Icon
        size={11}
        color={color}
        style={{ flexShrink: 0 }}
      />
      <span style={{
        fontFamily:    'JetBrains Mono',
        fontSize:      10,
        color,
        letterSpacing: '0.05em',
        whiteSpace:    'nowrap',
      }}>
        {label}
      </span>

      {showConfidence && (
        <>
          <span style={{
            width:        1,
            height:       10,
            background:   'rgba(255,255,255,0.15)',
            marginLeft:   2,
          }} />
          <span style={{
            fontFamily:    'JetBrains Mono',
            fontSize:      9,
            color:         confidenceColor,
            letterSpacing: '0.04em',
          }}>
            {confidencePct}%
          </span>
        </>
      )}

      <style>{`
        @keyframes badge-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>
    </button>
  )
}