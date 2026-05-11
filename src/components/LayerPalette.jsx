import {
  Grid2X2, Minimize2, Layers, Minus, SlidersHorizontal, Dices,
  GitMerge, Shuffle, ArrowLeftRight, Brain, Activity, BookOpen,
  AlignCenter, ChevronsUp, ChevronsDown, Box, Maximize2,
  Square, StretchHorizontal, Cpu,
} from 'lucide-react'
import { LAYER_COLORS, LAYER_TYPE_BADGE, LAYER_TOOLTIPS } from '../constants/layerDefaults.js'
import { useState } from 'react'



const LAYER_GROUPS = [
  {
    label: 'CONVOLUTIONS',
    color: '#00E5FF',
    layers: [
      { type: 'Conv2D',          icon: Grid2X2,         desc: 'Convolutional layer with learnable filters' },
      { type: 'ConvTranspose2D', icon: ChevronsUp,      desc: 'Transposed conv (learned upsampling / decoder)' },
    ],
  },
  {
    label: 'POOLING',
    color: '#7C3AED',
    layers: [
      { type: 'MaxPool2D',       icon: Minimize2,       desc: '2D max pooling for spatial downsampling' },
      { type: 'AvgPool2D',       icon: ChevronsDown,    desc: '2D average pooling' },
      { type: 'GlobalAvgPool',   icon: Maximize2,       desc: 'Global avg pool: [B,C,H,W] → [B,C]' },
      { type: 'AdaptiveAvgPool', icon: Box,             desc: 'Adaptive avg pool to fixed output size' },
    ],
  },
  {
    label: 'LINEAR',
    color: '#10B981',
    layers: [
      { type: 'Dense',           icon: Layers,          desc: 'Fully connected linear transformation' },
      { type: 'Flatten',         icon: Minus,           desc: 'Flatten multi-dim tensor to 1D' },
    ],
  },
  {
    label: 'NORMALIZATION',
    color: '#EC4899',
    layers: [
      { type: 'BatchNorm',       icon: SlidersHorizontal, desc: 'Normalize activations per batch' },
      { type: 'GroupNorm',       icon: StretchHorizontal, desc: 'Group norm — works on small batches' },
      { type: 'LayerNorm',       icon: AlignCenter,     desc: 'Normalize across last dims — shape passthrough' },
    ],
  },
  {
    label: 'REGULARIZATION',
    color: '#64748B',
    layers: [
      { type: 'Dropout',         icon: Dices,           desc: 'Randomly zero activations during training' },
    ],
  },
  {
    label: 'SPATIAL OPS',
    color: '#06B6D4',
    layers: [
      { type: 'Upsample',        icon: ChevronsUp,      desc: 'Non-learned spatial upsampling (nearest/bilinear)' },
      { type: 'ZeroPad2D',       icon: Square,          desc: 'Pad spatial dims with zeros' },
    ],
  },
  {
    label: 'BRANCHING',
    color: '#F59E0B',
    layers: [
      { type: 'Merge',           icon: GitMerge,        desc: 'Merge two branches via ADD or CONCAT' },
    ],
  },
  {
    label: 'SHAPE OPS',
    color: '#818CF8',
    layers: [
      { type: 'Reshape',         icon: Shuffle,         desc: 'Reshape tensor to a new [C, H, W] layout' },
      { type: 'Permute',         icon: ArrowLeftRight,  desc: 'Reorder tensor dimensions (transpose/permute)' },
    ],
  },
  {
    label: 'ATTENTION',
    color: '#A855F7',
    layers: [
      { type: 'MultiHeadAttention', icon: Brain,        desc: 'Self-attention for Transformers, BERT, ViT' },
    ],
  },
  {
    label: 'SEQUENCE',
    color: '#F472B6',
    layers: [
      { type: 'LSTM',            icon: Activity,        desc: 'Sequence model with gated memory cells' },
      { type: 'GRU',             icon: Cpu,             desc: 'Gated Recurrent Unit — faster than LSTM' },
      { type: 'Embedding',       icon: BookOpen,        desc: 'Map integer token IDs to dense vectors' },
    ],
  },
]



const TOOLTIP_EXTRAS = {
  Merge:              'Accepts 2 inputs. Toggle ADD ↔ CONCAT on node.',
  Reshape:            'Set target [C, H, W] in inspector. Element count must match input.',
  Permute:            'Edit dim order in inspector. e.g. [0,2,3,1] → NHWC',
  MultiHeadAttention: 'Input: [B, seq_len, embed_dim]\nembed_dim must be divisible by num_heads.',
  LSTM:               'Input: [B, seq_len, input_size]\nToggle bidirectional in inspector.',
  GRU:                'Input: [B, seq_len, input_size]\nFewer params than LSTM, similar performance.',
  Embedding:          'Input: [B, seq_len] — integer token IDs.\nOutput: [B, seq_len, embed_dim]',
  LayerNorm:          'Shape passthrough. Required in every Transformer / attention block.',
  ConvTranspose2D:    'Used in decoders, U-Nets, GANs. Increases spatial resolution.',
  GlobalAvgPool:      'Collapses H×W spatial dims entirely. Common before classifier head.',
  AdaptiveAvgPool:    'Pools to fixed output regardless of input size. outputSize=1 = GAP.',
}



function LayerChip({ type, icon: Icon, desc }) {
  const [hovering, setHovering] = useState(false)
  const color   = LAYER_COLORS[type]    || '#00E5FF'
  const badge   = LAYER_TYPE_BADGE[type] || '??'
  const tooltip = LAYER_TOOLTIPS[type]   || ''
  const extra   = TOOLTIP_EXTRAS[type]   || ''

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
          padding: '7px 10px',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.15s ease',
          userSelect: 'none',
          boxShadow: hovering ? `0 0 12px rgba(0,229,255,0.08)` : 'none',
        }}
      >
        <div style={{
          width: 26, height: 26,
          background: `${color}14`,
          border: `1px solid ${color}30`,
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={12} color={color} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 11, color: '#fff', letterSpacing: '0.03em' }}>
            {type}
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono', fontSize: 8,
            background: `${color}18`, border: `1px solid ${color}30`,
            color, padding: '0px 4px', borderRadius: 3,
            display: 'inline-block', marginTop: 2,
            letterSpacing: '0.06em',
          }}>
            {badge}
          </div>
        </div>
      </div>

      {hovering && (
        <div style={{
          position: 'absolute',
          left: 'calc(100% + 8px)',
          top: '50%',
          transform: 'translateY(-50%)',
          background: '#0D1526',
          border: '1px solid rgba(0,229,255,0.2)',
          borderRadius: 6,
          padding: '8px 10px',
          zIndex: 9999,
          width: 185,
          pointerEvents: 'none',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontFamily: 'Syne', fontSize: 10, color: '#00E5FF', fontWeight: 600, marginBottom: 3 }}>
            {type}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4, marginBottom: extra ? 6 : 0 }}>
            {desc}
          </div>
          {tooltip && (
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8.5, color: 'rgba(0,229,255,0.5)', marginBottom: extra ? 4 : 0 }}>
              {tooltip}
            </div>
          )}
          {extra && (
            <div style={{
              borderTop: `1px solid ${color}20`,
              paddingTop: 5, marginTop: 2,
              fontFamily: 'JetBrains Mono', fontSize: 8,
              color: `${color}bb`, lineHeight: 1.5,
              whiteSpace: 'pre-line',
            }}>
              {extra}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── GROUP HEADER ─────────────────────────────────────────────────────────────

function GroupHeader({ label, color }) {
  return (
    <div style={{
      fontFamily: 'Syne', fontWeight: 700, fontSize: 8.5,
      color: `${color}cc`,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      padding: '8px 2px 4px',
      borderBottom: `1px solid ${color}15`,
      marginBottom: 4,
    }}>
      {label}
    </div>
  )
}


export default function LayerPalette() {
  const [search, setSearch] = useState('')
  const query = search.toLowerCase()

  const filteredGroups = LAYER_GROUPS.map(group => ({
    ...group,
    layers: group.layers.filter(l =>
      !query || l.type.toLowerCase().includes(query) || l.desc.toLowerCase().includes(query)
    ),
  })).filter(g => g.layers.length > 0)

  return (
    <div style={{
      width: 210,
      flexShrink: 0,
      background: '#080C14',
      borderRight: '1px solid rgba(0,229,255,0.07)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(0,229,255,0.06)' }}>
        <span style={{
          fontFamily: 'Syne', fontWeight: 700, fontSize: 10,
          color: '#00E5FF', letterSpacing: '0.18em', textTransform: 'uppercase',
        }}>
          LAYERS
        </span>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8.5, color: 'rgba(255,255,255,0.2)', marginTop: 3 }}>
          drag to canvas
        </div>
        {/* Search */}
        <input
          type="text"
          placeholder="filter layers…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            marginTop: 8,
            width: '100%',
            background: '#0D1526',
            border: '1px solid rgba(0,229,255,0.12)',
            borderRadius: 5,
            padding: '4px 8px',
            fontFamily: 'JetBrains Mono',
            fontSize: 9.5,
            color: '#00E5FF',
            outline: 'none',
          }}
        />
      </div>

      {/* Layer list */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '8px 10px 12px',
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        {filteredGroups.map(group => (
          <div key={group.label}>
            <GroupHeader label={group.label} color={group.color} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
              {group.layers.map(({ type, icon, desc }) => (
                <LayerChip key={type} type={type} icon={icon} desc={desc} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 14px',
        borderTop: '1px solid rgba(0,229,255,0.06)',
        fontFamily: 'JetBrains Mono', fontSize: 8,
        color: 'rgba(255,255,255,0.15)', lineHeight: 1.6, textAlign: 'center',
      }}>
        Drop layers onto the canvas.<br />Connect handles to build your network.
      </div>
    </div>
  )
}