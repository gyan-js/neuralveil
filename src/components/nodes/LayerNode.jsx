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
  const { layerType, config, bootDelay = 0, cliVerified = false } = data
  const shapeResults      = useGraphStore(s => s.shapeResults)
  const format            = useGraphStore(s => s.format)
  const executionMode     = useGraphStore(s => s.executionMode)
  const selectedNodeId    = useGraphStore(s => s.selectedNodeId)
  const selectNode        = useGraphStore(s => s.selectNode)
  const deselectNode      = useGraphStore(s => s.deselectNode)
  const rippleNodes       = useGraphStore(s => s.rippleNodes)
  const diffMode          = useGraphStore(s => s.diffMode)
  const diffNodeStateMap  = useGraphStore(s => s.diffNodeStateMap)


  const nodeDS       = diffMode ? (diffNodeStateMap.get(id) ?? null) : null
  const diffState    = nodeDS?.state ?? null          // 'unchanged'|'modified'|'added'|'deleted'|null
  const diffChanges  = nodeDS?.changes ?? []
  const [showChangelog, setShowChangelog] = useState(false)
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
  const inputShape  = data.verifiedInputShape  ?? result?.inputShape  ?? null
  const outputShape = data.verifiedOutputShape ?? result?.outputShape ?? null
  const hasError    = !!result?.error
  const isSelected  = selectedNodeId === id
  const isCLIMode   = executionMode === 'cli' || cliVerified

  const params     = inputShape ? countParams(layerType, inputShape, config) : (data.paramCount ?? 0)
  const highParams = params > 5e6

  const accentColor = LAYER_COLORS[layerType] || '#00E5FF'
  const badge       = LAYER_TYPE_BADGE[layerType] || '??'

  
  const ERROR_COLORS = {
    MISSING_INPUT: '#FFE155',
    NO_INPUT:      '#FFE155',
  }
  const errorColor = hasError ? (ERROR_COLORS[result.error] ?? '#FF6B35') : null
  const isYellowError = hasError && result.error in ERROR_COLORS
 

  let glowClass = 'node-idle'
  if (diffState === 'deleted')   glowClass = 'node-diff-deleted'
  else if (diffState === 'added')     glowClass = 'node-diff-added node-boot'
  else if (diffState === 'modified')  glowClass = 'node-diff-modified'
  else if (diffState === 'unchanged') glowClass = 'node-diff-unchanged'
  else if (isSelected)            glowClass = 'node-selected'
  else if (isYellowError)         glowClass = 'node-idle'
  else if (hasError)              glowClass = 'node-error error-pulse-anim'
  else if (highParams)            glowClass = 'node-warning'
  else if (isCLIMode)             glowClass = 'node-cli-verified'
  if (rippling && !diffState)     glowClass += ' shape-ripple'

  
  const errorGlowStyle = isYellowError ? {
    boxShadow: `0 0 0 1px ${errorColor}CC, 0 0 28px ${errorColor}55, 0 0 55px ${errorColor}20`,
    borderColor: `${errorColor}CC`,
  } : {}

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
        opacity: diffState === 'unchanged' ? 0.3
               : diffState === 'deleted'   ? 0.6
               : booted ? 1 : 0,
        cursor: 'pointer',
        minWidth: 220,
        borderLeftColor: diffState === 'deleted'  ? '#FF6B35'
                       : diffState === 'added'    ? '#00E5FF'
                       : diffState === 'modified' ? '#F59E0B'
                       : hasError ? errorColor : accentColor,
        borderLeftWidth: 2,
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease',
        ...(diffState === 'deleted' ? {
          borderColor: '#FF6B35',
          boxShadow: '0 0 0 1px rgba(255,107,53,0.4)',
        } : {}),
        ...errorGlowStyle,
      }}
      onClick={() => isSelected ? deselectNode() : selectNode(id)}
    >

      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: hasError ? errorColor : accentColor,
            boxShadow: `0 0 6px ${hasError ? errorColor : accentColor}`,
          }} />
          <span style={{
            fontFamily: 'Syne', fontWeight: 700, fontSize: 13,
            color: diffState === 'deleted'  ? '#FF6B35'
                 : diffState === 'added'    ? '#00E5FF'
                 : diffState === 'modified' ? '#F59E0B'
                 : hasError ? errorColor : '#fff',
            letterSpacing: '0.04em', transition: 'color 0.3s ease',
            textDecoration: diffState === 'deleted' ? 'line-through' : 'none',
            opacity: diffState === 'deleted' ? 0.7 : 1,
          }}>
            {layerType}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontFamily: 'JetBrains Mono', fontSize: 9,
            background: hasError ? `${errorColor}1F` : `${accentColor}1A`,
            border: `1px solid ${hasError ? `${errorColor}4D` : `${accentColor}40`}`,
            color: hasError ? errorColor : accentColor,
            padding: '1px 7px', borderRadius: 4, letterSpacing: '0.06em',
          }}>
            {badge}
          </span>
          {isCLIMode && !hasError && (
            <span
              title="Shapes verified by local PyTorch execution via NeuralVeil CLI"
              style={{
                fontFamily: 'JetBrains Mono', fontSize: 8,
                background: 'rgba(168,85,247,0.15)',
                border: '1px solid rgba(168,85,247,0.4)',
                color: '#a855f7',
                padding: '1px 6px', borderRadius: 4, letterSpacing: '0.06em',
                cursor: 'help',
              }}
            >
              CLI ✓
            </span>
          )}

          {diffState === 'added' && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
              background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.4)',
              color: '#00E5FF', padding: '1px 6px', borderRadius: 4, letterSpacing: '0.06em',
            }}>
              + ADDED
            </span>
          )}
          {diffState === 'deleted' && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
              background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.4)',
              color: '#FF6B35', padding: '1px 6px', borderRadius: 4, letterSpacing: '0.06em',
              textDecoration: 'line-through',
            }}>
              − DEL
            </span>
          )}
          {diffState === 'modified' && (
            <span
              title="Click to see changed params"
              onClick={(e) => { e.stopPropagation(); setShowChangelog(v => !v) }}
              style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
                color: '#F59E0B', padding: '1px 6px', borderRadius: 4, letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              ~ MOD
            </span>
          )}
          {!diffState && (hasError
            ? <AlertTriangle size={12} color={errorColor} />
            : outputShape
              ? <CheckCircle2 size={12} color={isCLIMode ? '#a855f7' : '#39FF14'} strokeWidth={2.5} />
              : null
          )}
        </div>
      </div>

      {diffState === 'modified' && showChangelog && diffChanges.length > 0 && (
        <div style={{
          margin: '0 10px 8px',
          padding: '7px 10px',
          background: 'rgba(245,158,11,0.07)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 6,
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
            color: 'rgba(245,158,11,0.6)', letterSpacing: '0.1em',
            marginBottom: 5, textTransform: 'uppercase',
          }}>
            changed params
          </div>
          {diffChanges.map((c, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              marginBottom: i < diffChanges.length - 1 ? 4 : 0,
            }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                color: '#F59E0B', minWidth: 60,
              }}>
                {c.param}
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                color: 'rgba(255,107,53,0.8)',
                textDecoration: 'line-through',
              }}>
                {JSON.stringify(c.from)}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>→</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                color: '#00E5FF',
              }}>
                {JSON.stringify(c.to)}
              </span>
            </div>
          ))}
        </div>
      )}

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
            color: hasError ? `${errorColor}B3` : 'rgba(0,229,255,0.7)',
            letterSpacing: '0.02em',
          }}>
            {inputShape ? formatShape(inputShape, format) : '—'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>OUT</span>
          <span className={shapeFliping ? 'shape-flip' : ''} style={{
            fontFamily: 'JetBrains Mono', fontSize: 10,
            color: hasError ? errorColor : '#39FF14',
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
          background: `${errorColor}14`,
          border: `1px solid ${errorColor}40`,
          borderRadius: 6,
          fontFamily: 'JetBrains Mono', fontSize: 9, color: errorColor, lineHeight: 1.5,
        }}>
          {result.message}
        </div>
      )}

      <Handle type="target" position={Position.Top}    style={{ top: -6    }} />
      <Handle type="source" position={Position.Bottom} style={{ bottom: -6 }} />
    </div>
  )
}