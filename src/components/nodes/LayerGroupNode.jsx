import { Handle, Position } from '@xyflow/react'
import { useGraphStore } from '../../store/useGraphStore.js'
import { formatShape, countParams } from '../../engine/shapeEngine.js'
import { LAYER_COLORS, LAYER_TYPE_BADGE } from '../../constants/layerDefaults.js'
import { useEffect, useState, useRef, useCallback } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Layers } from 'lucide-react'
import OpNode from '../OpNode.jsx'

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

export default function LayerGroupNode({ id, data }) {
  const {
    layerType, config, bootDelay = 0, cliVerified = false,
    ops = [], opEdges = [],
  } = data

  const shapeResults      = useGraphStore(s => s.shapeResults)
  const format            = useGraphStore(s => s.format)
  const executionMode     = useGraphStore(s => s.executionMode)
  const selectedNodeId    = useGraphStore(s => s.selectedNodeId)
  const selectNode        = useGraphStore(s => s.selectNode)
  const deselectNode      = useGraphStore(s => s.deselectNode)
  const rippleNodes       = useGraphStore(s => s.rippleNodes)
  const diffMode          = useGraphStore(s => s.diffMode)
  const diffNodeStateMap  = useGraphStore(s => s.diffNodeStateMap)
  const expandedNodes     = useGraphStore(s => s.expandedNodes)
  const toggleExpanded    = useGraphStore(s => s.toggleExpanded)

  const isExpanded = expandedNodes.has(id)
  const hasOps = ops && ops.length > 0

  const nodeDS      = diffMode ? (diffNodeStateMap.get(id) ?? null) : null
  const diffState   = nodeDS?.state ?? null
  const diffChanges = nodeDS?.changes ?? []
  const [showChangelog, setShowChangelog] = useState(false)
  const [booted, setBooted]     = useState(false)
  const [rippling, setRippling] = useState(false)
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

  const ERROR_COLORS = { MISSING_INPUT: '#FFE155', NO_INPUT: '#FFE155' }
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

  // double-click toggles expand; single click selects
  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation()
    if (hasOps) toggleExpanded(id)
  }, [id, hasOps, toggleExpanded])

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    isSelected ? deselectNode() : selectNode(id)
  }, [isSelected, id, selectNode, deselectNode])

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
      case 'Conv1D':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 12px' }}>
            <ParamChip label="Filters" value={config.filters ?? 64} />
            <ParamChip label="Kernel"  value={config.kernelSize ?? 3} />
            <ParamChip label="Stride"  value={config.stride ?? 1} />
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
      case 'AvgPool2D':
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
      case 'Embedding': {
        const { num_embeddings = 10000, embedding_dim = 256 } = config
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            <ParamChip label="vocab" value={num_embeddings.toLocaleString()} />
            <ParamChip label="dim"   value={embedding_dim} />
          </div>
        )
      }
      case 'GlobalAvgPool':
        return (
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
            collapses H×W → scalar per channel
          </div>
        )
      case 'Flatten':
        return (
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
            no parameters
          </div>
        )
      case 'LayerNorm':
        return (
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
            shape passthrough
          </div>
        )
      default:
        return null
    }
  }


  const layerDisplayName = data.layerName
    ? data.layerName.replace(/^L__self__/, '').slice(0, 28)
    : layerType

  return (
    <div
      className={`layer-node-card node-boot ${glowClass}`}
      style={{
        animationDelay: booted ? '0ms' : `${bootDelay * 80}ms`,
        opacity: diffState === 'unchanged' ? 0.3
               : diffState === 'deleted'   ? 0.6
               : booted ? 1 : 0,
        cursor: 'pointer',
        minWidth: 230,
        maxWidth: isExpanded ? 340 : 260,
        width: isExpanded ? 340 : 'auto',
        borderLeftColor: diffState === 'deleted'  ? '#FF6B35'
                       : diffState === 'added'    ? '#00E5FF'
                       : diffState === 'modified' ? '#F59E0B'
                       : hasError ? errorColor : accentColor,
        borderLeftWidth: 2,
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease, max-width 0.25s ease, width 0.25s ease',
        ...(diffState === 'deleted' ? {
          borderColor: '#FF6B35',
          boxShadow: '0 0 0 1px rgba(255,107,53,0.4)',
        } : {}),
        ...errorGlowStyle,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: hasError ? errorColor : accentColor,
            boxShadow: `0 0 6px ${hasError ? errorColor : accentColor}`,
          }} />
          <div>
            <span style={{
              fontFamily: 'Syne', fontWeight: 700, fontSize: 13,
              color: diffState === 'deleted'  ? '#FF6B35'
                   : diffState === 'added'    ? '#00E5FF'
                   : diffState === 'modified' ? '#F59E0B'
                   : hasError ? errorColor : '#fff',
              letterSpacing: '0.04em', transition: 'color 0.3s ease',
              textDecoration: diffState === 'deleted' ? 'line-through' : 'none',
              opacity: diffState === 'deleted' ? 0.7 : 1,
              display: 'block',
            }}>
              {layerType}
            </span>
            {data.layerName && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 8,
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: '0.04em',
                display: 'block',
                marginTop: 1,
              }}>
                {layerDisplayName}
              </span>
            )}
          </div>
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
            <span title="Shapes verified by CLI execution" style={{
              fontFamily: 'JetBrains Mono', fontSize: 8,
              background: 'rgba(168,85,247,0.15)',
              border: '1px solid rgba(168,85,247,0.4)',
              color: '#a855f7',
              padding: '1px 6px', borderRadius: 4, letterSpacing: '0.06em',
              cursor: 'help',
            }}>CLI ✓</span>
          )}

          {diffState === 'added' && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
              background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.4)',
              color: '#00E5FF', padding: '1px 6px', borderRadius: 4,
            }}>+ ADDED</span>
          )}
          {diffState === 'deleted' && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
              background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.4)',
              color: '#FF6B35', padding: '1px 6px', borderRadius: 4,
              textDecoration: 'line-through',
            }}>− DEL</span>
          )}
          {diffState === 'modified' && (
            <span
              title="Click to see changed params"
              onClick={(e) => { e.stopPropagation(); setShowChangelog(v => !v) }}
              style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
                color: '#F59E0B', padding: '1px 6px', borderRadius: 4, cursor: 'pointer',
              }}
            >~ MOD</span>
          )}
          {!diffState && (hasError
            ? <AlertTriangle size={12} color={errorColor} />
            : outputShape
              ? <CheckCircle2 size={12} color={isCLIMode ? '#a855f7' : '#39FF14'} strokeWidth={2.5} />
              : null
          )}

          {/* expand/collapse toggle — only when ops exist */}
          {hasOps && !diffMode && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpanded(id) }}
              title={isExpanded ? 'Collapse ops (double-click)' : 'Expand ops (double-click)'}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: accentColor, display: 'flex', alignItems: 'center',
                padding: 2, borderRadius: 3,
                opacity: 0.7,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
            >
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* ── Changelog (diff modified) ──────────────────── */}
      {diffState === 'modified' && showChangelog && diffChanges.length > 0 && (
        <div style={{
          margin: '0 10px 8px', padding: '7px 10px',
          background: 'rgba(245,158,11,0.07)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 6,
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
            color: 'rgba(245,158,11,0.6)', letterSpacing: '0.1em',
            marginBottom: 5, textTransform: 'uppercase',
          }}>changed params</div>
          {diffChanges.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: i < diffChanges.length - 1 ? 4 : 0 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#F59E0B', minWidth: 60 }}>{c.param}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,107,53,0.8)', textDecoration: 'line-through' }}>{JSON.stringify(c.from)}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>→</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#00E5FF' }}>{JSON.stringify(c.to)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="layer-node-divider" />

      {/* ── Config params ─────────────────────────────── */}
      <div style={{ padding: '8px 14px' }}>
        {renderConfigChips()}
      </div>

      <div className="layer-node-divider" />

      {/* ── Shape I/O ────────────────────────────────── */}
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

      {/* ── Params ───────────────────────────────────── */}
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

      {/* ── Inline error ─────────────────────────────── */}
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

      {/* ── Ops expansion panel ──────────────────────── */}
      {hasOps && (
        <div style={{
          maxHeight: isExpanded ? 600 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <div className="layer-node-divider" />

          <div style={{ padding: '8px 10px' }}>
            {/* ops header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Layers size={9} color="rgba(255,255,255,0.3)" />
                <span style={{
                  fontFamily: 'Syne', fontSize: 8,
                  color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                }}>
                  OPS · {ops.length}
                </span>
              </div>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 7,
                color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em',
              }}>
                dbl-click to collapse
              </span>
            </div>

            {/* op nodes list */}
            {ops.length === 0 ? (
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: 'rgba(255,107,53,0.6)',
                fontStyle: 'italic',
                padding: '4px 0',
              }}>
                Op detail unavailable — hook capture. Re-run ptparse/tfparse for full ops.
              </div>
            ) : (
              ops.map((op, i) => (
                <OpNode key={op.id} op={op} index={i} total={ops.length} />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── ops pill (collapsed hint) ────────────────── */}
      {hasOps && !isExpanded && !diffMode && (
        <>
          <div className="layer-node-divider" />
          <div
            onClick={(e) => { e.stopPropagation(); toggleExpanded(id) }}
            style={{
              padding: '5px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              cursor: 'pointer',
              opacity: 0.55,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.55'}
          >
            <Layers size={9} color={accentColor} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8, color: accentColor, letterSpacing: '0.08em',
            }}>
              {ops.length} op{ops.length !== 1 ? 's' : ''} · expand
            </span>
            <ChevronDown size={9} color={accentColor} />
          </div>
        </>
      )}

      <Handle type="target" position={Position.Top}    style={{ top: -6    }} />
      <Handle type="source" position={Position.Bottom} style={{ bottom: -6 }} />
    </div>
  )
}