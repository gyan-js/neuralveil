import { Handle, Position } from '@xyflow/react'
import { useGraphStore } from '../../store/useGraphStore.js'
import { formatShape, countParams } from '../../engine/shapeEngine.js'
import { LAYER_COLORS, LAYER_TYPE_BADGE } from '../../constants/layerDefaults.js'
import { useEffect, useState, useRef } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

function formatParamCount(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toLocaleString()
}

function ParamChip({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{
        fontFamily: 'Syne', fontSize: 8, color: 'rgba(255,255,255,0.3)',
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        {label}
      </span>
      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
        {value}
      </span>
    </div>
  )
}

export default function LayerNode({ id, data }) {
  const { layerType, config, bootDelay = 0 } = data
  const shapeResults  = useGraphStore(s => s.shapeResults)
  const format        = useGraphStore(s => s.format)
  const selectedNodeId = useGraphStore(s => s.selectedNodeId)
  const selectNode    = useGraphStore(s => s.selectNode)
  const deselectNode  = useGraphStore(s => s.deselectNode)
  const rippleNodes   = useGraphStore(s => s.rippleNodes)
  const [booted, setBooted]       = useState(false)
  const [rippling, setRippling]   = useState(false)
  const prevFormat = useRef(format)
  const [shapeFliping, setShapeFlipping] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), bootDelay * 80 + 50)
    return () => clearTimeout(t)
  }, [bootDelay])

  useEffect(() => {
    if (rippleNodes.has(id)) {
      setRippling(true)
      const t = setTimeout(() => setRippling(false), 700)
      return () => clearTimeout(t)
    }
  }, [rippleNodes, id])

  useEffect(() => {
    if (prevFormat.current !== format) {
      setShapeFlipping(true)
      const t = setTimeout(() => setShapeFlipping(false), 400)
      prevFormat.current = format
      return () => clearTimeout(t)
    }
  }, [format])

  const result      = shapeResults[id]
  const inputShape  = result?.inputShape  ?? null
  const outputShape = result?.outputShape ?? null
  const hasError    = !!result?.error
  const isSelected  = selectedNodeId === id

  const params     = inputShape ? countParams(layerType, inputShape, config) : 0
  const highParams = params > 5e6

  const accentColor = LAYER_COLORS[layerType] || '#00E5FF'
  const badge       = LAYER_TYPE_BADGE[layerType] || '??'

  let glowClass = 'node-idle'
  if (isSelected)       glowClass = 'node-selected'
  else if (hasError)    glowClass = 'node-error error-pulse-anim'
  else if (highParams)  glowClass = 'node-warning'
  if (rippling)         glowClass += ' shape-ripple'

  const renderConfigChips = () => {
    switch (layerType) {
      case 'Conv2D':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 12px' }}>
            <ParamChip label="Filters" value={config.filters ?? 64} />
            <ParamChip label="Kernel"  value={`${config.kernelSize ?? 3}×${config.kernelSize ?? 3}`} />
            <ParamChip label="Stride"  value={config.stride ?? 1} />
            <ParamChip label="Pad"     value={config.padding ?? 0} />
            <ParamChip label="Dilation" value={config.dilation ?? 1} />
          </div>
        )
      case 'MaxPool2D':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 12px' }}>
            <ParamChip label="Kernel" value={`${config.kernelSize ?? 2}×${config.kernelSize ?? 2}`} />
            <ParamChip label="Stride" value={config.stride ?? 2} />
            <ParamChip label="Pad"    value={config.padding ?? 0} />
          </div>
        )
      case 'Dense':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
            <ParamChip label="Units" value={(config.units ?? 256).toLocaleString()} />
          </div>
        )
      case 'BatchNorm':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            <ParamChip label="eps"      value={config.eps?.toExponential(0) ?? '1e-5'} />
            <ParamChip label="momentum" value={config.momentum ?? 0.1} />
          </div>
        )
      case 'Dropout':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
            <ParamChip label="p (drop rate)" value={config.p ?? 0.5} />
          </div>
        )
      case 'Flatten':
        return (
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
            no parameters
          </div>
        )
      case 'Reshape': {
        const { targetC, targetH, targetW } = config
        const parts = [targetC, targetH, targetW].filter(d => d !== undefined && d !== null)
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 12px' }}>
            {targetC !== undefined && <ParamChip label="C" value={targetC} />}
            {targetH !== undefined && <ParamChip label="H" value={targetH} />}
            {targetW !== undefined && <ParamChip label="W" value={targetW} />}
          </div>
        )
      }
      case 'Permute': {
        const perm = config.permutation ?? [0, 1, 2, 3]
        return (
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
            [{perm.join(', ')}]
          </div>
        )
      }
      case 'MultiHeadAttention': {
        const { embed_dim = 512, num_heads = 8, dropout = 0.1 } = config
        const headDim = embed_dim % num_heads === 0 ? embed_dim / num_heads : null
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 12px' }}>
            <ParamChip label="embed_dim" value={embed_dim} />
            <ParamChip label="heads"     value={num_heads} />
            <ParamChip label="head_dim"  value={headDim !== null ? headDim : '⚠'} />
            <ParamChip label="dropout"   value={dropout} />
          </div>
        )
      }
      case 'LSTM': {
        const { hidden_size = 256, num_layers = 1, bidirectional = false, return_sequences = true } = config
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            <ParamChip label="hidden"   value={hidden_size} />
            <ParamChip label="layers"   value={num_layers} />
            <ParamChip label="bidir"    value={bidirectional ? 'YES' : 'NO'} />
            <ParamChip label="ret_seq"  value={return_sequences ? 'YES' : 'NO'} />
          </div>
        )
      }
      case 'Embedding': {
        const { num_embeddings = 10000, embedding_dim = 256 } = config
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            <ParamChip label="vocab"    value={num_embeddings.toLocaleString()} />
            <ParamChip label="dim"      value={embedding_dim} />
          </div>
        )
      }
      case 'LayerNorm': {
        return (
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
            shape passthrough
          </div>
        )
      }
      case 'ConvTranspose2D':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 12px' }}>
            <ParamChip label="Filters" value={config.filters ?? 64} />
            <ParamChip label="Kernel"  value={`${config.kernelSize ?? 2}×${config.kernelSize ?? 2}`} />
            <ParamChip label="Stride"  value={config.stride ?? 2} />
            <ParamChip label="Pad"     value={config.padding ?? 0} />
          </div>
        )
      case 'AvgPool2D':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 12px' }}>
            <ParamChip label="Kernel" value={`${config.kernelSize ?? 2}×${config.kernelSize ?? 2}`} />
            <ParamChip label="Stride" value={config.stride ?? 2} />
            <ParamChip label="Pad"    value={config.padding ?? 0} />
          </div>
        )
      case 'GlobalAvgPool':
        return (
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
            collapses H×W → scalar per channel
          </div>
        )
      case 'AdaptiveAvgPool':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            <ParamChip label="Out H" value={config.outputH ?? 1} />
            <ParamChip label="Out W" value={config.outputW ?? 1} />
          </div>
        )
      case 'GroupNorm':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            <ParamChip label="Groups" value={config.numGroups ?? 32} />
            <ParamChip label="eps"    value={config.eps?.toExponential(0) ?? '1e-5'} />
          </div>
        )
      case 'Upsample':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            <ParamChip label="Scale" value={config.scaleFactor ?? 2} />
            <ParamChip label="Mode"  value={config.mode ?? 'nearest'} />
          </div>
        )
      case 'ZeroPad2D':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            <ParamChip label="Pad H" value={config.padH ?? 1} />
            <ParamChip label="Pad W" value={config.padW ?? 1} />
          </div>
        )
      case 'GRU': {
        const { hidden_size = 256, num_layers = 1, bidirectional = false, return_sequences = true } = config
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            <ParamChip label="hidden"  value={hidden_size} />
            <ParamChip label="layers"  value={num_layers} />
            <ParamChip label="bidir"   value={bidirectional ? 'YES' : 'NO'} />
            <ParamChip label="ret_seq" value={return_sequences ? 'YES' : 'NO'} />
          </div>
        )
      }
      default:
        return null
    }
  }

  return (
    <div
      className={`layer-node-card node-boot ${glowClass}`}
      style={{
        animationDelay: booted ? '0ms' : `${bootDelay * 80}ms`,
        opacity: booted ? 1 : 0,
        cursor: 'pointer',
        minWidth: 220,
        borderLeftColor: hasError ? '#FF6B35' : accentColor,
        borderLeftWidth: 2,
        transition: 'border-color 0.3s ease',
      }}
      onClick={() => isSelected ? deselectNode() : selectNode(id)}
    >

      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: hasError ? '#FF6B35' : accentColor,
            boxShadow: `0 0 6px ${hasError ? '#FF6B35' : accentColor}`,
          }} />
          <span style={{
            fontFamily: 'Syne', fontWeight: 700, fontSize: 13,
            color: hasError ? '#FF6B35' : '#fff',
            letterSpacing: '0.04em', transition: 'color 0.3s ease',
          }}>
            {layerType}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontFamily: 'JetBrains Mono', fontSize: 9,
            background: hasError ? 'rgba(255,107,53,0.12)' : `${accentColor}1A`,
            border: `1px solid ${hasError ? 'rgba(255,107,53,0.3)' : `${accentColor}40`}`,
            color: hasError ? '#FF6B35' : accentColor,
            padding: '1px 7px', borderRadius: 4, letterSpacing: '0.06em',
          }}>
            {badge}
          </span>
          {hasError
            ? <AlertTriangle size={12} color="#FF6B35" />
            : outputShape
              ? <CheckCircle2 size={12} color="#39FF14" strokeWidth={2.5} />
              : null
          }
        </div>
      </div>

      <div className="layer-node-divider" />

      <div style={{ padding: '8px 14px' }}>
        {renderConfigChips()}
      </div>

      <div className="layer-node-divider" />

     
      <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>IN</span>
          <span className={shapeFliping ? 'shape-flip' : ''} style={{
            fontFamily: 'JetBrains Mono', fontSize: 10,
            color: hasError ? 'rgba(255,107,53,0.7)' : 'rgba(0,229,255,0.7)',
            letterSpacing: '0.02em',
          }}>
            {inputShape ? formatShape(inputShape, format) : '—'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>OUT</span>
          <span className={shapeFliping ? 'shape-flip' : ''} style={{
            fontFamily: 'JetBrains Mono', fontSize: 10,
            color: hasError ? '#FF6B35' : '#39FF14',
            letterSpacing: '0.02em', fontWeight: 500,
          }}>
            {outputShape ? formatShape(outputShape, format) : '???'}
          </span>
        </div>
      </div>

  
      {params > 0 && (
        <>
          <div className="layer-node-divider" />
          <div style={{ padding: '6px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>PARAMS</span>
            <span style={{
              fontFamily: 'JetBrains Mono', fontSize: 10,
              color: highParams ? '#FFD700' : 'rgba(255,215,0,0.6)',
              letterSpacing: '0.02em',
            }}>
              {formatParamCount(params)}
            </span>
          </div>
        </>
      )}

      {/* Inline error */}
      {hasError && result?.message && (
        <div style={{
          margin: '0 10px 10px', padding: '6px 10px',
          background: 'rgba(255,107,53,0.08)',
          border: '1px solid rgba(255,107,53,0.25)',
          borderRadius: 6,
          fontFamily: 'JetBrains Mono', fontSize: 9, color: '#FF6B35', lineHeight: 1.5,
        }}>
          {result.message}
        </div>
      )}

      <Handle type="target" position={Position.Top}    style={{ top: -6    }} />
      <Handle type="source" position={Position.Bottom} style={{ bottom: -6 }} />
    </div>
  )
}