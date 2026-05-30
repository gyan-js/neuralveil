import { useState, useEffect } from 'react'


const G = {
  gold:         '#c9a84c',
  goldDim:      '#a07c30',
  goldGlow:     'rgba(201,168,76,0.16)',
  goldBorder:   'rgba(201,168,76,0.28)',
  goldBorderLo: 'rgba(201,168,76,0.12)',
  goldBorderMd: 'rgba(201,168,76,0.2)',
  goldText:     '#d4b86a',
  bgPanel:      '#0e0c08',
  bgBlock:      'rgba(0,0,0,0.35)',
  bgHover:      'rgba(201,168,76,0.05)',
  ink:          '#ede8d8',
  inkDim:       '#8a7d60',
  inkFaint:     '#4a4230',
  divider:      'rgba(160,140,90,0.1)',
}

const TOOLS = [
  {
    id: 'shape',
    tag: 'TOOL 01',
    badge: 'WASM RUNTIME',
    name: 'SHAPE TRACER',
    headline: 'Know your tensor shapes before you run a single epoch.',
    bullets: [
      'Real PyTorch semantics via Pyodide WASM',
      'Catches mismatches at layer depth',
      'Supports dynamic shapes & optional branches',
      'Export trace as JSON / architecture diff',
    ],
  },
  {
    id: 'vram',
    tag: 'TOOL 02',
    badge: 'DISTRIBUTED AWARE',
    name: 'VRAM ESTIMATOR',
    headline: 'Model your GPU memory before touching a cluster.',
    bullets: [
      'FSDP sharding + activation checkpointing',
      'DDP with gradient bucket sizing',
      'Tensor Parallel rank-zero peak projections',
      'BF16 / FP16 / FP32 / INT8 awareness',
    ],
  },
]

export default function ToolPicker({ onSelect, onClose }) {
  const [hovered, setHovered] = useState(null)   // 'shape' | 'vram' | null
  const [hoverClose, setHoverClose] = useState(false)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (

    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        backgroundColor: 'rgba(4,3,1,0.88)',
        backdropFilter: 'blur(7px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
  
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%', maxWidth: '680px',
          backgroundColor: G.bgPanel,
          border: `1px solid ${G.goldBorder}`,
          borderRadius: '3px',
          overflow: 'hidden',
          boxShadow: `0 0 80px ${G.goldGlow}, 0 40px 80px rgba(0,0,0,0.7)`,
        }}
      >
        {/* Corner brackets */}
        <CornerAccent pos="tl" />
        <CornerAccent pos="br" />

        {/* ── Header ── */}
        <div style={{
          borderBottom: `1px solid ${G.divider}`,
          padding: '22px 28px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div className="font-mono-jb" style={{
              fontSize: '9px', letterSpacing: '0.18em',
              color: G.goldDim, marginBottom: '5px',
            }}>
              // SELECT YOUR TOOL
            </div>
            <div className="font-bebas" style={{
              fontSize: '24px', letterSpacing: '0.06em',
              color: G.ink, lineHeight: 1,
            }}>
              ENTER THE FORGE
            </div>
          </div>

          {/* Close × */}
          <button
            onClick={onClose}
            onMouseEnter={() => setHoverClose(true)}
            onMouseLeave={() => setHoverClose(false)}
            style={{
              background: 'transparent', border: 'none',
              cursor: 'pointer', padding: '4px 8px',
              color: hoverClose ? G.goldText : G.inkFaint,
              fontSize: '18px', lineHeight: 1,
              transition: 'color 0.2s ease',
            }}
          >
            ×
          </button>
        </div>

        {/* ── Sub-header ── */}
        <div style={{ padding: '18px 28px 0' }}>
          <p className="font-mono-jb" style={{
            fontSize: '11px', color: G.inkDim, lineHeight: 1.8,
            borderLeft: `2px solid ${G.goldBorderLo}`,
            paddingLeft: '12px', margin: 0,
          }}>
            Two precision instruments. Pick the one you need — you'll confirm the legal docs on the next step.
          </p>
        </div>

        {/* ── Tool cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          padding: '20px 28px 28px',
        }}>
          {TOOLS.map(tool => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isHovered={hovered === tool.id}
              onHover={setHovered}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── ToolCard ───────────────────────────────────────────────────────────── */

function ToolCard({ tool, isHovered, onHover, onSelect }) {
  return (
    <div
      onMouseEnter={() => onHover(tool.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(tool.id)}
      style={{
        position: 'relative',
        backgroundColor: isHovered ? G.bgHover : G.bgBlock,
        border: `1px solid ${isHovered ? G.goldBorder : G.goldBorderLo}`,
        borderRadius: '3px',
        padding: '20px 20px 18px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        overflow: 'hidden',
      }}
    >
      {/* Top-left mini corner when hovered */}
      {isHovered && (
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: '20px', height: '20px',
          borderTop: `1px solid ${G.gold}`,
          borderLeft: `1px solid ${G.gold}`,
          opacity: 0.8,
        }} />
      )}

      {/* Badge */}
      <div className="font-mono-jb" style={{
        display: 'inline-block',
        fontSize: '8px', letterSpacing: '0.14em',
        color: isHovered ? G.gold : G.goldDim,
        border: `1px solid ${isHovered ? G.goldBorder : G.goldBorderLo}`,
        padding: '2px 8px', borderRadius: '2px',
        marginBottom: '14px',
        transition: 'all 0.2s ease',
      }}>
        {tool.badge}
      </div>

      {/* Tag */}
      <div className="font-mono-jb" style={{
        fontSize: '9px', color: G.inkFaint,
        letterSpacing: '0.1em', marginBottom: '3px',
      }}>
        {tool.tag}
      </div>

      {/* Name */}
      <div className="font-bebas" style={{
        fontSize: '28px', letterSpacing: '0.04em',
        color: isHovered ? G.ink : '#b8a890',
        lineHeight: 1, marginBottom: '10px',
        transition: 'color 0.2s ease',
      }}>
        {tool.name}
      </div>

      {/* Headline */}
      <p className="font-mono-jb" style={{
        fontSize: '11px',
        color: isHovered ? G.goldText : G.inkFaint,
        lineHeight: 1.65, marginBottom: '14px',
        fontStyle: 'italic',
        transition: 'color 0.2s ease',
      }}>
        {tool.headline}
      </p>

      {/* Bullets */}
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {tool.bullets.map((b, i) => (
          <li key={i} className="font-mono-jb" style={{
            fontSize: '10px',
            color: isHovered ? G.inkDim : G.inkFaint,
            paddingLeft: '13px', position: 'relative',
            marginBottom: '3px', lineHeight: 1.55,
            transition: 'color 0.2s ease',
          }}>
            <span style={{
              position: 'absolute', left: 0, top: '5px',
              width: '4px', height: '4px', borderRadius: '50%',
              backgroundColor: isHovered ? G.gold : G.inkFaint,
              transition: 'background-color 0.2s ease',
            }} />
            {b}
          </li>
        ))}
      </ul>

      {/* Select prompt */}
      <div className="font-mono-jb" style={{
        marginTop: '18px',
        fontSize: '10px', letterSpacing: '0.14em',
        color: isHovered ? G.gold : G.inkFaint,
        display: 'flex', alignItems: 'center', gap: '6px',
        transition: 'color 0.2s ease',
      }}>
        <span style={{
          display: 'inline-block',
          transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
          transition: 'transform 0.2s ease',
        }}>→</span>
        SELECT THIS TOOL
      </div>
    </div>
  )
}

/* ─── Decorative corner bracket ─────────────────────────────────────────── */
function CornerAccent({ pos }) {
  const isTop = pos === 'tl'
  return (
    <div style={{
      position: 'absolute',
      ...(isTop ? { top: 0, left: 0 } : { bottom: 0, right: 0 }),
      width: '32px', height: '32px',
      borderTop:    isTop  ? `2px solid ${G.gold}` : 'none',
      borderLeft:   isTop  ? `2px solid ${G.gold}` : 'none',
      borderBottom: !isTop ? `1px solid ${G.goldBorderLo}` : 'none',
      borderRight:  !isTop ? `1px solid ${G.goldBorderLo}` : 'none',
      opacity: isTop ? 0.65 : 0.4,
      pointerEvents: 'none',
    }} />
  )
}