import { useEffect, useRef } from 'react'
import { useGraphStore } from '../store/useGraphStore.js'
import OpNode from './OpNode.jsx'
import { X, Layers, ChevronDown, ChevronUp } from 'lucide-react'
const PANEL_WIDTH = 320

export default function OpsExpandPanel() {
  const selectedNodeId   = useGraphStore(s => s.selectedNodeId)
  const nodes            = useGraphStore(s => s.nodes)
  const expandedNodes    = useGraphStore(s => s.expandedNodes)
  const toggleExpanded   = useGraphStore(s => s.toggleExpanded)
  const opVisibility     = useGraphStore(s => s.opVisibility)
  const deselectNode     = useGraphStore(s => s.deselectNode)
  const captureBackend   = useGraphStore(s => s.captureBackend)
  const hookFallbackUsed = useGraphStore(s => s.hookFallbackUsed)

  const selectedNode = nodes.find(n => n.id === selectedNodeId)
  const ops          = selectedNode?.data?.ops ?? []
  const layerType    = selectedNode?.data?.layerType ?? ''
  const layerName    = selectedNode?.data?.layerName ?? null
  const hasOps       = ops.length > 0

  // Panel is visible when a node with ops is selected
  const isOpen = !!(selectedNodeId && selectedNode?.type === 'layerGroupNode' && opVisibility !== 'none')

  const isExpanded   = expandedNodes.has(selectedNodeId ?? '')

  const scrollRef = useRef(null)

  // Reset scroll when node changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [selectedNodeId])

  const accentColor = '#00E5FF'

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: PANEL_WIDTH,
        zIndex: 200,
        transform: isOpen ? 'translateX(0)' : `translateX(${PANEL_WIDTH + 20}px)`,
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
        background: '#0D1526',
        borderLeft: '1px solid rgba(0,229,255,0.12)',
        boxShadow: isOpen ? '-8px 0 40px rgba(0,0,0,0.5), -1px 0 0 rgba(0,229,255,0.06)' : 'none',
        fontFamily: "'Syne', sans-serif",
        pointerEvents: isOpen ? 'all' : 'none',
      }}
    >
      {/* ── Header ────────────────────────────────────────── */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid rgba(0,229,255,0.08)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {/* title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: accentColor,
              boxShadow: `0 0 6px ${accentColor}`,
            }} />
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: '#fff',
              letterSpacing: '0.04em',
            }}>
              {layerType}
            </span>
            {layerName && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 8,
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: '0.04em',
              }}>
                {layerName.replace(/^L__self__/, '').slice(0, 22)}
              </span>
            )}
          </div>

          <button
            onClick={() => deselectNode()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)',
              display: 'flex',
              padding: 4,
              borderRadius: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            title="Close panel"
          >
            <X size={14} />
          </button>
        </div>

        {/* ops count + inline expand toggle row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Layers size={9} color="rgba(255,255,255,0.3)" />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              {hasOps ? `${ops.length} op${ops.length !== 1 ? 's' : ''}` : 'no op detail'}
            </span>
          </div>

          {/* Toggle whether ops also expand inline on the canvas node */}
          {hasOps && selectedNodeId && (
            <button
              onClick={() => toggleExpanded(selectedNodeId)}
              title={isExpanded ? 'Collapse inline on canvas' : 'Also expand inline on canvas'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: isExpanded ? 'rgba(0,229,255,0.1)' : 'transparent',
                border: `1px solid ${isExpanded ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 4,
                padding: '2px 8px',
                cursor: 'pointer',
                color: isExpanded ? accentColor : 'rgba(255,255,255,0.35)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 8,
                letterSpacing: '0.06em',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.5)'; e.currentTarget.style.color = accentColor }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = isExpanded ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.12)'
                e.currentTarget.style.color = isExpanded ? accentColor : 'rgba(255,255,255,0.35)'
              }}
            >
              {isExpanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
              {isExpanded ? 'inline on' : 'inline off'}
            </button>
          )}
        </div>

        {/* Hook fallback warning banner */}
        {hookFallbackUsed && (
          <div style={{
            padding: '5px 8px',
            background: 'rgba(251,191,36,0.07)',
            border: '1px solid rgba(251,191,36,0.25)',
            borderRadius: 5,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            color: 'rgba(251,191,36,0.8)',
            lineHeight: 1.5,
          }}>
            ⚠ Hook-capture fallback used — some layers may be missing op detail. Re-run ptparse/tfparse for full ops.
          </div>
        )}
      </div>

      {/* ── Op list ───────────────────────────────────────── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 12px',
        }}
      >
        {!hasOps ? (
          /* Empty state */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 10,
            paddingBottom: 60,
          }}>
            <Layers size={28} color="rgba(255,255,255,0.1)" />
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: 'rgba(255,107,53,0.5)',
              fontStyle: 'italic',
              textAlign: 'center',
              lineHeight: 1.6,
              margin: 0,
              maxWidth: 220,
            }}>
              Op detail unavailable — hook capture.<br />
              Re-run ptparse/tfparse for full ops.
            </p>
          </div>
        ) : (
          ops.map((op, i) => (
            <OpNode key={op.id ?? i} op={op} index={i} total={ops.length} />
          ))
        )}
      </div>

      {/* ── Footer: backend info ──────────────────────────── */}
      {captureBackend && (
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid rgba(0,229,255,0.06)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}>
          {/* BackendBadge is rendered inline here to avoid an extra import cycle */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: hookFallbackUsed ? '#FBBF24' : (captureBackend === 'pytorch' ? '#39FF14' : '#00E5FF'),
            background: `${hookFallbackUsed ? '#FBBF24' : (captureBackend === 'pytorch' ? '#39FF14' : '#00E5FF')}1A`,
            border: `1px solid ${hookFallbackUsed ? '#FBBF24' : (captureBackend === 'pytorch' ? '#39FF14' : '#00E5FF')}40`,
            borderRadius: 4,
            padding: '3px 8px',
            letterSpacing: '0.04em',
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: hookFallbackUsed ? '#FBBF24' : (captureBackend === 'pytorch' ? '#39FF14' : '#00E5FF'),
              flexShrink: 0,
            }} />
            {captureBackend === 'pytorch' ? 'PT' : 'TF'}
            {' · '}
            {ops.length} ops
          </div>
        </div>
      )}
    </div>
  )
}