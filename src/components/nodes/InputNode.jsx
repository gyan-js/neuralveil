
import { Handle, Position } from '@xyflow/react'
import { useGraphStore } from '../../store/useGraphStore.js'
import { formatShape } from '../../engine/shapeEngine.js'
import { useEffect, useState } from 'react'

export default function InputNode({ id }) {
  const inputShape = useGraphStore(s => s.inputShape)
  const format = useGraphStore(s => s.format)
  const updateInputShape = useGraphStore(s => s.updateInputShape)
  const selectedNodeId = useGraphStore(s => s.selectedNodeId)
  const selectNode = useGraphStore(s => s.selectNode)
  const deselectNode = useGraphStore(s => s.deselectNode)
  const [booted, setBooted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 50)
    return () => clearTimeout(t)
  }, [])

  const isSelected = selectedNodeId === id
  const [batch, channels, H, W] = inputShape

  const update = (idx, val) => {
    const v = Math.max(1, parseInt(val) || 1)
    const next = [...inputShape]
    next[idx] = v
    updateInputShape(next)
  }

  const fields = format === 'NCHW'
    ? [
        { label: 'B', idx: 0, val: batch, hint: 'Batch' },
        { label: 'C', idx: 1, val: channels, hint: 'Channels' },
        { label: 'H', idx: 2, val: H, hint: 'Height' },
        { label: 'W', idx: 3, val: W, hint: 'Width' },
      ]
    : [
        { label: 'B', idx: 0, val: batch, hint: 'Batch' },
        { label: 'H', idx: 2, val: H, hint: 'Height' },
        { label: 'W', idx: 3, val: W, hint: 'Width' },
        { label: 'C', idx: 1, val: channels, hint: 'Channels' },
      ]

  return (
    <div
      className={`layer-node-card node-boot ${isSelected ? 'node-selected' : 'node-idle'}`}
      style={{
        animationDelay: booted ? '0ms' : '0ms',
        minWidth: 220,
        cursor: 'pointer',
      }}
      onClick={() => isSelected ? deselectNode() : selectNode(id)}
    >
  
      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#39FF14',
            boxShadow: '0 0 8px #39FF14',
          }} />
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#fff', letterSpacing: '0.04em' }}>
            INPUT
          </span>
        </div>
        <span style={{
          fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 500,
          background: 'rgba(57,255,20,0.12)', border: '1px solid rgba(57,255,20,0.3)',
          color: '#39FF14', padding: '1px 7px', borderRadius: 4,
          letterSpacing: '0.06em',
        }}>
          IN
        </span>
      </div>

      <div className="layer-node-divider" />

      
      <div style={{ padding: '10px 14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px' }}>
          {fields.map(({ label, idx, val, hint }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {hint}
              </span>
              <input
                type="number"
                value={val}
                min={1}
                onChange={e => update(idx, e.target.value)}
                style={{ width: '100%' }}
                onClick={e => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="layer-node-divider" />

     
      <div style={{ padding: '8px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>OUT</span>
          <span style={{
            fontFamily: 'JetBrains Mono', fontSize: 10,
            color: '#39FF14',
            letterSpacing: '0.02em',
          }}>
            {formatShape(inputShape, format)}
          </span>
        </div>
      </div>

     
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ bottom: -6 }}
      />
    </div>
  )
}
