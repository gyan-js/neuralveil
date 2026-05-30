import { useGraphStore } from '../store/useGraphStore.js'
import { GitCompare, Plus, Pencil, Minus, ArrowRight, X, Layers } from 'lucide-react'
import { useMemo } from 'react'
import { countParams } from '../engine/shapeEngine.js'
function formatParamDelta(n) {
  const abs = Math.abs(n)
  const sign = n >= 0 ? '+' : '−'
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`
  return `${sign}${abs.toLocaleString()}`
}

function StatPill({ icon: Icon, count, label, color, dimColor }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 10px',
      background: `${color}0D`,
      border: `1px solid ${color}25`,
      borderRadius: 7,
      minWidth: 0,
    }}>
      <Icon size={11} color={color} strokeWidth={2.5} style={{ flexShrink: 0 }} />
      <div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 15, fontWeight: 700,
          color,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {count}
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8, color: dimColor ?? `${color}80`,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginTop: 1,
        }}>
          {label}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DiffSummary() {
  const diffMode     = useGraphStore(s => s.diffMode)
  const diffResult   = useGraphStore(s => s.diffResult)
  const snapshots    = useGraphStore(s => s.snapshots)
  const diffBaseId   = useGraphStore(s => s.diffBaseId)
  const diffTargetId = useGraphStore(s => s.diffTargetId)
  const exitDiff     = useGraphStore(s => s.exitDiff)
  const nodes        = useGraphStore(s => s.nodes)
  const shapeResults = useGraphStore(s => s.shapeResults)

  const snapA = snapshots.find(s => s.id === diffBaseId)
  const snapB = snapshots.find(s => s.id === diffTargetId)

  // Compute param delta
  const paramDelta = useMemo(() => {
    if (!diffResult) return 0
    // Params in B (current canvas)
    let paramsB = 0
    for (const n of nodes) {
      if (n.data?.layerType === 'Input') continue
      const r = shapeResults[n.id]
      if (r?.inputShape) paramsB += countParams(n.data.layerType, r.inputShape, n.data.config || {})
    }

    let paramsA = 0
    if (snapA) {
      for (const n of snapA.nodes) {
        if (n.data?.layerType === 'Input') continue
        const cfg = n.data?.config ?? {}
        const lt  = n.data?.layerType
        if (lt === 'Dense')  paramsA += (cfg.units ?? 0) * 1 // units only (rough)
        if (lt === 'Conv2D') paramsA += (cfg.filters ?? 0) * (cfg.kernelSize ?? 3) ** 2
        if (lt === 'LSTM')   paramsA += (cfg.hidden_size ?? 0) * 4
      }
    }
    return paramsB - paramsA
  }, [diffResult, nodes, shapeResults, snapA])

  const totalParamChanges = useMemo(() => {
    if (!diffResult) return 0
    return diffResult.modified.reduce((acc, m) => acc + m.changes.length, 0)
  }, [diffResult])

  if (!diffMode || !diffResult) return null

  const { added, modified, deleted, edgesAdded, edgesDeleted } = diffResult
  const edgeChanges = edgesAdded.length + edgesDeleted.length

  return (
    <div style={{
      position: 'absolute',
      bottom: 80,             // above ReactFlow Controls
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      background: 'rgba(8,15,30,0.96)',
      border: '1px solid rgba(0,229,255,0.2)',
      borderRadius: 12,
      padding: '12px 16px',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,229,255,0.06) inset',
      minWidth: 460,
      maxWidth: 560,
      fontFamily: "'Syne', sans-serif",
    }}>


      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GitCompare size={13} color="#00E5FF" />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, color: 'rgba(255,255,255,0.6)',
            letterSpacing: '0.06em',
          }}>
            <span style={{
              background: 'rgba(255,107,53,0.15)',
              border: '1px solid rgba(255,107,53,0.3)',
              borderRadius: 4, padding: '1px 7px',
              color: '#FF6B35', fontWeight: 700,
              maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {snapA?.name ?? 'Base'}
            </span>
            <ArrowRight size={11} color="rgba(255,255,255,0.3)" />
            <span style={{
              background: 'rgba(0,229,255,0.1)',
              border: '1px solid rgba(0,229,255,0.25)',
              borderRadius: 4, padding: '1px 7px',
              color: '#00E5FF', fontWeight: 700,
              maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {snapB?.name ?? 'Target'}
            </span>
          </div>
        </div>

        <button
          onClick={exitDiff}
          style={{
            background: 'rgba(255,107,53,0.1)',
            border: '1px solid rgba(255,107,53,0.25)',
            borderRadius: 6,
            color: '#FF6B35',
            cursor: 'pointer',
            padding: '4px 10px',
            display: 'flex', alignItems: 'center', gap: 5,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,107,53,0.2)'
            e.currentTarget.style.borderColor = 'rgba(255,107,53,0.5)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,107,53,0.1)'
            e.currentTarget.style.borderColor = 'rgba(255,107,53,0.25)'
          }}
        >
          <X size={10} />
          EXIT DIFF
        </button>
      </div>

      {/* ── Stat pills ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <StatPill icon={Plus}   count={added.length}    label="added"    color="#00E5FF" />
        <StatPill icon={Pencil} count={modified.length} label="modified" color="#F59E0B" />
        <StatPill icon={Minus}  count={deleted.length}  label="deleted"  color="#FF6B35" />
        <StatPill icon={Layers} count={edgeChanges}     label="edges"    color="rgba(255,255,255,0.5)" />

        {/* Param delta */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          background: paramDelta === 0
            ? 'rgba(255,255,255,0.04)'
            : paramDelta > 0
              ? 'rgba(0,229,255,0.06)'
              : 'rgba(255,107,53,0.06)',
          border: `1px solid ${paramDelta === 0
            ? 'rgba(255,255,255,0.1)'
            : paramDelta > 0 ? 'rgba(0,229,255,0.2)' : 'rgba(255,107,53,0.2)'}`,
          borderRadius: 7,
          marginLeft: 'auto',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12, fontWeight: 700,
            color: paramDelta === 0
              ? 'rgba(255,255,255,0.4)'
              : paramDelta > 0 ? '#00E5FF' : '#FF6B35',
            lineHeight: 1,
          }}>
            {paramDelta === 0 ? '±0' : formatParamDelta(paramDelta)}
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8, color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1,
          }}>
            params
          </div>
        </div>
      </div>

      {totalParamChanges > 0 && (
        <div style={{
          marginTop: 8,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.06em',
          paddingTop: 8,
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          {totalParamChanges} config param{totalParamChanges !== 1 ? 's' : ''} changed across {modified.length} modified node{modified.length !== 1 ? 's' : ''}
          {modified.slice(0, 3).map(m => (
            <span key={m.nodeId} style={{
              marginLeft: 6,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 3, padding: '0 5px',
              color: '#F59E0B',
            }}>
              {m.changes.map(c =>
                `${c.param}: ${JSON.stringify(c.from)} → ${JSON.stringify(c.to)}`
              ).join(', ')}
            </span>
          ))}
          {modified.length > 3 && (
            <span style={{ color: 'rgba(255,255,255,0.2)', marginLeft: 4 }}>
              +{modified.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}