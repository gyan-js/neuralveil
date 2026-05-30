import { useGraphStore } from '../store/useGraphStore.js'

function formatParams(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toLocaleString()
}

export default function StatusBar() {
  const nodes = useGraphStore(s => s.nodes)
  const format = useGraphStore(s => s.format)
  const getTotalParams = useGraphStore(s => s.getTotalParams)
  const getErrorCount = useGraphStore(s => s.getErrorCount)

  const totalParams = getTotalParams()
  const errorCount = getErrorCount()
  const layerCount = nodes.filter(n => n.data?.layerType !== 'Input').length
  const hasErrors = errorCount > 0

  return (
    <div style={{
      height: 36,
      background: '#050810',
      borderTop: '1px solid rgba(0,229,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 0,
      flexShrink: 0,
    }}>
      {/* Left: params */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
        <StatItem label="TOTAL PARAMS" value={formatParams(totalParams)} color="rgba(255,255,255,0.7)" />
        <Divider />
        <StatItem label="TRAINABLE" value={formatParams(totalParams)} color="rgba(255,255,255,0.7)" />
      </div>

      {/* Center: errors */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <StatItem
          label="ERRORS"
          value={errorCount}
          color={hasErrors ? '#FF6B35' : '#39FF14'}
          pulse={hasErrors}
        />
      </div>

      {/* Right: meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, justifyContent: 'flex-end' }}>
        <StatItem label="FORMAT" value={format} color="rgba(255,255,255,0.7)" />
        <Divider />
        <StatItem label="LAYERS" value={layerCount} color="rgba(255,255,255,0.7)" />
        <Divider />
        <StatItem label="STATUS" value={hasErrors ? 'ERRORS DETECTED' : 'ALL VALID'} color={hasErrors ? '#FF6B35' : '#39FF14'} />
      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.07)' }} />
}

function StatItem({ label, value, color, pulse }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        fontFamily: 'Syne', fontSize: 8.5, letterSpacing: '0.12em',
        color: 'rgba(0,229,255,0.75)', textTransform: 'uppercase',
      }}>
        {label}:
      </span>
      <span style={{
        fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 600,
        color,
        animation: pulse ? 'errorPulse 1s ease-in-out infinite' : 'none',
      }}>
        {value}
      </span>
    </div>
  )
}
