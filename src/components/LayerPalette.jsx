import { Grid2X2, Minimize2, Layers, Minus, SlidersHorizontal, Dices, GitMerge } from 'lucide-react'
import { LAYER_COLORS, LAYER_TYPE_BADGE, LAYER_TOOLTIPS } from '../constants/layerDefaults.js'
import { useState } from 'react'

const LAYERS_CONFIG = [
  { type: 'Conv2D', icon: Grid2X2, desc: 'Convolutional layer with learnable filters' },
  { type: 'MaxPool2D', icon: Minimize2, desc: '2D max pooling for spatial downsampling' },
  { type: 'Dense', icon: Layers, desc: 'Fully connected linear transformation' },
  { type: 'Flatten', icon: Minus, desc: 'Flatten multi-dim tensor to 1D' },
  { type: 'BatchNorm', icon: SlidersHorizontal, desc: 'Normalize activations per batch' },
  { type: 'Dropout', icon: Dices, desc: 'Randomly zero activations during training' },
  { type: 'Merge', icon: GitMerge, desc: 'Merge two branches via ADD or CONCAT' },
]

function LayerChip({ type, icon: Icon, desc }) {
  const [hovering, setHovering] = useState(false)
  const color = LAYER_COLORS[type] || '#00E5FF'
  const badge = LAYER_TYPE_BADGE[type] || '??'
  const tooltip = LAYER_TOOLTIPS[type] || ''

  const isMerge = type === 'Merge'

  const onDragStart = (e) => {
    e.dataTransfer.setData('application/reactflow', type)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        draggable
        onDragStart={onDragStart}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        style={{
          background: hovering ? 'rgba(0,229,255,0.05)' : '#0D1526',
          border: `1px solid ${hovering ? 'rgba(0,229,255,0.2)' : 'rgba(0,229,255,0.07)'}`,
          borderLeft: `2px solid ${color}`,
          borderRadius: 8,
          padding: '8px 10px',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          transition: 'all 0.15s ease',
          userSelect: 'none',
          boxShadow: hovering ? `0 0 12px rgba(0,229,255,0.08)` : 'none',
          // Subtle distinction for Merge
          ...(isMerge && {
            borderTop: '1px solid rgba(245,158,11,0.12)',
            marginTop: 4,
          }),
        }}
      >
        <div style={{
          width: 28, height: 28,
          background: `${color}14`,
          border: `1px solid ${color}30`,
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={13} color={color} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 12, color: '#fff', letterSpacing: '0.03em' }}>
            {type}
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono', fontSize: 8.5,
            background: `${color}18`, border: `1px solid ${color}30`,
            color, padding: '0px 5px', borderRadius: 3,
            display: 'inline-block', marginTop: 2,
            letterSpacing: '0.06em',
          }}>
            {badge}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hovering && (
        <div style={{
          position: 'absolute',
          left: 'calc(100% + 8px)',
          top: '50%',
          transform: 'translateY(-50%)',
          background: '#0D1526',
          border: '1px solid rgba(0,229,255,0.2)',
          borderRadius: 6,
          padding: '6px 10px',
          zIndex: 9999,
          width: 170,
          pointerEvents: 'none',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontFamily: 'Syne', fontSize: 10, color: '#00E5FF', fontWeight: 600, marginBottom: 3 }}>
            {type}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4, marginBottom: 4 }}>
            {desc}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8.5, color: 'rgba(0,229,255,0.5)' }}>
            {tooltip}
          </div>
          {isMerge && (
            <div style={{
              marginTop: 6,
              paddingTop: 5,
              borderTop: '1px solid rgba(245,158,11,0.15)',
              fontFamily: 'JetBrains Mono', fontSize: 8,
              color: 'rgba(245,158,11,0.7)',
              lineHeight: 1.5,
            }}>
              Accepts 2 inputs.<br />Toggle ADD ↔ CONCAT on node.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function LayerPalette() {
  return (
    <div style={{
      width: 200,
      flexShrink: 0,
      background: '#080C14',
      borderRight: '1px solid rgba(0,229,255,0.07)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid rgba(0,229,255,0.06)',
      }}>
        <span style={{
          fontFamily: 'Syne', fontWeight: 700, fontSize: 10,
          color: '#00E5FF', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
          LAYERS
        </span>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8.5, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
          drag to canvas
        </div>
      </div>

      {/* Layer chips */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {LAYERS_CONFIG.map(({ type, icon, desc }) => (
          <LayerChip key={type} type={type} icon={icon} desc={desc} />
        ))}
      </div>

      {/* Footer hint */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid rgba(0,229,255,0.06)',
        fontFamily: 'JetBrains Mono',
        fontSize: 8,
        color: 'rgba(255,255,255,0.18)',
        lineHeight: 1.6,
        textAlign: 'center',
      }}>
        Drop layers onto the canvas.<br />Connect handles to build your network.
      </div>
    </div>
  )
}