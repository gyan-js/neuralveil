import { Handle, Position } from '@xyflow/react'
import { useGraphStore } from '../../store/useGraphStore.js'
import { formatShape } from '../../engine/shapeEngine.js'
import { useEffect, useState } from 'react'
import { GitMerge, AlertTriangle, CheckCircle2 } from 'lucide-react'

const MERGE_ACCENT = '#F59E0B' // amber — distinct from other layer colors

export default function MergeNode({ id, data }) {
  const { config = {}, bootDelay = 0 } = data
  const mode = config.mode || 'add'

  const shapeResults = useGraphStore(s => s.shapeResults)
  const format = useGraphStore(s => s.format)
  const selectedNodeId = useGraphStore(s => s.selectedNodeId)
  const selectNode = useGraphStore(s => s.selectNode)
  const deselectNode = useGraphStore(s => s.deselectNode)
  const updateNodeConfig = useGraphStore(s => s.updateNodeConfig)

  const [booted, setBooted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), bootDelay * 80 + 50)
    return () => clearTimeout(t)
  }, [bootDelay])

  const result = shapeResults[id]
  const outputShape = result?.outputShape ?? null
  const inputShapes = result?.inputShapes ?? []
  const hasError = !!result?.error
  const isSelected = selectedNodeId === id

  const toggleMode = (e) => {
    e.stopPropagation()
    updateNodeConfig(id, { mode: mode === 'add' ? 'concat' : 'add' })
  }

  let glowClass = 'node-idle'
  if (isSelected) glowClass = 'node-selected'
  else if (hasError) glowClass = 'node-error error-pulse-anim'

  // okay so here i added two  target handles one on top-left and another on top-right
  const handle1Style = { top: -6, left: '30%', transform: 'translateX(-50%)' }
  const handle2Style = { top: -6, left: '70%', transform: 'translateX(-50%)' }

  return (
    <div
      className={`layer-node-card node-boot ${glowClass}`}
      style={{
        animationDelay: booted ? '0ms' : `${bootDelay * 80}ms`,
        opacity: booted ? 1 : 0,
        cursor: 'pointer',
        minWidth: 220,
        borderLeftColor: hasError ? '#FF6B35' : MERGE_ACCENT,
        borderLeftWidth: 2,
        transition: 'border-color 0.3s ease',
      }}
      onClick={() => isSelected ? deselectNode() : selectNode(id)}
    >
      {/* 2 inpt handles */}
      <Handle type="target" position={Position.Top} id="input-a" style={handle1Style} />
      <Handle type="target" position={Position.Top} id="input-b" style={handle2Style} />


      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: hasError ? '#FF6B35' : MERGE_ACCENT,
            boxShadow: `0 0 6px ${hasError ? '#FF6B35' : MERGE_ACCENT}`,
          }} />
          <span style={{
            fontFamily: 'Syne', fontWeight: 700, fontSize: 13,
            color: hasError ? '#FF6B35' : '#fff',
            letterSpacing: '0.04em',
          }}>
            MERGE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* made an ADD/CONCAT mode toggle pill */}
          <button
            onClick={toggleMode}
            style={{
              fontFamily: 'JetBrains Mono', fontSize: 9,
              background: mode === 'add' ? 'rgba(245,158,11,0.15)' : 'rgba(139,92,246,0.15)',
              border: `1px solid ${mode === 'add' ? 'rgba(245,158,11,0.4)' : 'rgba(139,92,246,0.4)'}`,
              color: mode === 'add' ? MERGE_ACCENT : '#8B5CF6',
              padding: '2px 8px', borderRadius: 4, letterSpacing: '0.06em',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {mode === 'add' ? 'ADD' : 'CONCAT'}
          </button>
          {hasError
            ? <AlertTriangle size={12} color="#FF6B35" />
            : outputShape
              ? <CheckCircle2 size={12} color="#39FF14" strokeWidth={2.5} />
              : null
          }
        </div>
      </div>

      <div className="layer-node-divider" />

      {/* Input handle labels */}
      <div style={{ padding: '8px 14px', display: 'flex', gap: 8 }}>
        <div style={{
          flex: 1,
          background: 'rgba(245,158,11,0.05)',
          border: '1px solid rgba(245,158,11,0.12)',
          borderRadius: 5,
          padding: '5px 8px',
        }}>
          <div style={{ fontFamily: 'Syne', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 3 }}>
            IN A
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(0,229,255,0.7)' }}>
            {inputShapes[0] ? formatShape(inputShapes[0], format) : '—'}
          </div>
        </div>
        <div style={{
          flex: 1,
          background: 'rgba(139,92,246,0.05)',
          border: '1px solid rgba(139,92,246,0.12)',
          borderRadius: 5,
          padding: '5px 8px',
        }}>
          <div style={{ fontFamily: 'Syne', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 3 }}>
            IN B
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(139,92,246,0.7)' }}>
            {inputShapes[1] ? formatShape(inputShapes[1], format) : '—'}
          </div>
        </div>
      </div>

      <div className="layer-node-divider" />

      {/* here is the description of the mode  */}
      <div style={{ padding: '6px 14px' }}>
        <div style={{
          fontFamily: 'JetBrains Mono', fontSize: 8.5,
          color: 'rgba(255,255,255,0.25)',
          lineHeight: 1.4,
        }}>
          {mode === 'add'
            ? 'Element-wise addition. Shapes must be identical.'
            : 'Concatenate on channel dim. Batch + spatial must match.'}
        </div>
      </div>

      <div className="layer-node-divider" />


      <div style={{ padding: '8px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>OUT</span>
          <span style={{
            fontFamily: 'JetBrains Mono', fontSize: 10,
            color: hasError ? '#FF6B35' : '#39FF14',
            letterSpacing: '0.02em',
            fontWeight: 500,
          }}>
            {outputShape ? formatShape(outputShape, format) : '???'}
          </span>
        </div>
      </div>

      {hasError && result?.message && (
        <div style={{
          margin: '0 10px 10px',
          padding: '6px 10px',
          background: 'rgba(255,107,53,0.08)',
          border: '1px solid rgba(255,107,53,0.25)',
          borderRadius: 6,
          fontFamily: 'JetBrains Mono',
          fontSize: 9,
          color: '#FF6B35',
          lineHeight: 1.5,
        }}>
          {result.message}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ bottom: -6 }} />
    </div>
  )
}