import { useGraphStore } from '../store/useGraphStore.js'
const BACKEND_LABEL = {
  pytorch: 'PT',
  tensorflow: 'TF',
}

const BACKEND_COLOR = {
  pytorch: '#39FF14',
  tensorflow: '#00E5FF',
}

const FALLBACK_COLOR = '#FBBF24'

export default function BackendBadge() {
  const captureBackend  = useGraphStore(s => s.captureBackend)
  const backendVersion  = useGraphStore(s => s.backendVersion)
  const hookFallbackUsed = useGraphStore(s => s.hookFallbackUsed)

  if (!captureBackend) return null

  const usingFallback = !!hookFallbackUsed
  const color = usingFallback ? FALLBACK_COLOR : (BACKEND_COLOR[captureBackend] ?? '#94A3B8')
  const label = BACKEND_LABEL[captureBackend] ?? captureBackend.slice(0, 2).toUpperCase()
  const versionStr = backendVersion ? ` v${backendVersion}` : ''

  return (
    <div
      title={
        usingFallback
          ? 'Hook-capture fallback was used — some layers may be missing op-level detail'
          : `Captured via ${captureBackend}`
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color,
        background: `${color}1A`,
        border: `1px solid ${color}40`,
        borderRadius: 4,
        padding: '3px 8px',
        letterSpacing: '0.04em',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 4px ${color}`,
          flexShrink: 0,
        }}
      />
      {label}{versionStr}
      {usingFallback && <span style={{ opacity: 0.85 }}>⚠</span>}
    </div>
  )
}