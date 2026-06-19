import { formatShape } from "../engine/shapeEngine.js"
import { useGraphStore } from '../store/useGraphStore.js'


const OP_COLORS = {
  relu:               '#39FF14',
  leaky_relu:         '#22c55e',
  gelu:               '#4ade80',
  silu:               '#86efac',
  sigmoid:            '#facc15',
  tanh:               '#fb923c',
  softmax:            '#f97316',
  batch_norm:         '#EC4899',
  layer_norm:         '#DB2777',
  dropout:            '#64748B',
  conv2d:             '#00E5FF',
  conv1d:             '#00B8D4',
  conv3d:             '#0097A7',
  mm:                 '#818CF8',
  linear:             '#818CF8',
  matmul:             '#818CF8',
  add:                '#F59E0B',
  mul:                '#F59E0B',
  adaptive_avg_pool:  '#7C3AED',
  max_pool2d:         '#9333EA',
  permute:            '#34D399',
  reshape:            '#34D399',
  transpose:          '#34D399',
  softmax:            '#f97316',
  unknown_op:         '#475569',
}

const OP_SHORT = {
  relu:               'RELU',
  leaky_relu:         'L-RELU',
  gelu:               'GELU',
  silu:               'SILU',
  sigmoid:            'SIGM',
  tanh:               'TANH',
  softmax:            'SMAX',
  batch_norm:         'BN',
  layer_norm:         'LN',
  dropout:            'DROP',
  conv2d:             'CONV',
  conv1d:             'C1D',
  conv3d:             'C3D',
  mm:                 'MM',
  linear:             'FC',
  matmul:             'MATM',
  add:                'ADD',
  mul:                'MUL',
  adaptive_avg_pool:  'APOOL',
  max_pool2d:         'MPOOL',
  permute:            'PERM',
  reshape:            'RSHP',
  transpose:          'TPOSE',
  unknown_op:         '???',
}

function formatMeta(meta) {
  if (!meta || Object.keys(meta).length === 0) return null
  return Object.entries(meta)
    .slice(0, 3) // cap at 3 meta entries for compactness
    .map(([k, v]) => {
      const val = Array.isArray(v) ? `[${v.join(',')}]` : String(v)
      return `${k}:${val}`
    })
    .join('  ')
}

export default function OpNode({ op, index, total }) {
  const format = useGraphStore(s => s.format)

  const { opType, inputShape, outputShape, meta } = op
  const color = OP_COLORS[opType] ?? '#475569'
  const short = OP_SHORT[opType] ?? opType.slice(0, 5).toUpperCase()
  const metaStr = formatMeta(meta)

  const isLast = index === total - 1

  return (
    <div style={{
      position: 'relative',
      marginBottom: isLast ? 0 : 6,
    }}>
      {/* connector line to next op */}
      {!isLast && (
        <div style={{
          position: 'absolute',
          left: 17,
          bottom: -6,
          width: 1,
          height: 6,
          background: `${color}55`,
        }} />
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 8px',
        background: `${color}0D`,
        border: `1px solid ${color}33`,
        borderLeft: `2px solid ${color}`,
        borderRadius: 6,
        cursor: 'default',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = `${color}18`}
      onMouseLeave={e => e.currentTarget.style.background = `${color}0D`}
      >
        {/* dot */}
        <div style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          flexShrink: 0,
          background: color,
          boxShadow: `0 0 5px ${color}`,
        }} />

        {/* badge */}
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8,
          color,
          background: `${color}1A`,
          border: `1px solid ${color}40`,
          padding: '1px 5px',
          borderRadius: 3,
          letterSpacing: '0.06em',
          flexShrink: 0,
          minWidth: 32,
          textAlign: 'center',
        }}>
          {short}
        </span>

        {/* shapes */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
        }}>
          <span style={{ color: 'rgba(0,229,255,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {inputShape ? formatShape(inputShape, format) : '—'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>→</span>
          <span style={{ color: 'rgba(57,255,20,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {outputShape ? formatShape(outputShape, format) : '—'}
          </span>
        </div>

        {/* meta */}
        {metaStr && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            color: 'rgba(255,255,255,0.25)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {metaStr}
          </span>
        )}
      </div>
    </div>
  )
}