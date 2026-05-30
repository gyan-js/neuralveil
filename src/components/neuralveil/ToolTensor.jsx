import { useState, useEffect, useRef } from 'react'
import { useIntersectionObserver } from '../hooks/useIntersectionObserver'
import DendriteField from '../../assets/svgs/DendriteField'
import nvtsdimg1 from '../../assets/nvtsdimg1.png'
import nvtsdimg2 from '../../assets/nvtsdimg2.png'
import nvtsdimg3 from '../../assets/nvtsdimg3.png'
import nvtsdimg4 from '../../assets/nvtsdimg4.png'
import nvtsdimg5 from '../../assets/nvtsdimg5.png'
const tensorErrorScenarios = [
  {
    id: 'shape-mismatch',
    label: 'Shape Mismatch',
    icon: '⬡',
    tag: 'ERR_01',
    lines: [
      { text: 'RuntimeError: Expected input size (32, 512) but got (32, 256)', type: 'error' },
      { text: '  at linear layer 3 → check your projection head', type: 'muted' },
      { text: 'ValueError: Tensors have incompatible shapes for concatenation', type: 'error' },
      { text: '  [128, 64, 64] vs [128, 64, 32] on dim 2', type: 'muted' },
    ],
    punchline: '// sound familiar?',
  },
  {
    id: 'silent-reshape',
    label: 'Silent Reshape',
    icon: '◈',
    tag: 'ERR_02',
    lines: [
      { text: 'silent squeeze: tensor([1, 512]) passed as [512]', type: 'error' },
      { text: '  — your model trained. your results are wrong.', type: 'muted' },
      { text: 'no crash. no warning. just corrupted outputs.', type: 'error' },
      { text: `epoch 47 / 50 — you'll never know.`, type: 'muted' },
    ],
    punchline: '// trained successfully. totally broken.',
  },
  {
    id: 'broadcast-hell',
    label: 'Broadcast Hell',
    icon: '◉',
    tag: 'ERR_03',
    lines: [
      { text: 'RuntimeError: The size of tensor a (256) must match tensor b (512)', type: 'error' },
      { text: '  at elementwise op — dim 1 broadcast collapsed wrong', type: 'muted' },
      { text: 'AssertionError: logits shape [32, 10] != labels shape [32]', type: 'error' },
      { text: '  loss function received garbage. silently averaged it.', type: 'muted' },
    ],
    punchline: '// broadcast rules are not on your side.',
  },
]

const tensorFeatures = [
  {
    id: 'trace',
    label: 'Dim Tracer',
    short: 'Every op. Every layer.',
    desc: 'Traces tensor dimensions at every single operation across your entire forward pass — not just where it crashes, but where the shape silently drifted three layers earlier.',
  },
  {
    id: 'graph',
    label: 'Shape-Flow Graph',
    short: 'Visual arch map.',
    desc: 'Builds a live visual graph of how shapes evolve across your architecture — attention heads, projection layers, skip connections, all annotated with actual runtime dimensions.',
  },
  {
    id: 'prerun',
    label: 'Pre-Runtime Catch',
    short: 'Before it explodes.',
    desc: 'Catches mismatches before a single forward pass runs. Static analysis + AST trace = zero wasted GPU cycles on doomed training runs.',
  },
  {
    id: 'silent',
    label: 'Silent Bug Surface',
    short: 'The invisible killer.',
    desc: 'Surfaces shape mismatches at the exact op where they originate — not just where PyTorch finally throws.',
  },
  {
    id: 'annotate',
    label: 'Auto Annotate',
    short: 'Errors with context.',
    desc: 'Every mismatch surfaces with the originating op, the expected vs actual shape, and the exact layer — no stack-trace archaeology required.',
  },
]


function MobileStyles() {
  return (
    <style>{`
      @media (max-width: 768px) {
        .tool-tensor-section {
          padding: 80px 0 80px !important;
        }
        .tool-tensor-watermark {
          display: none !important;
        }
        .tool-tensor-header {
          margin-bottom: 36px !important;
          flex-wrap: wrap;
        }
        .tool-tensor-header h2 {
          font-size: clamp(26px, 7vw, 38px) !important;
        }
        .tool-tensor-error-section {
          margin-bottom: 48px !important;
        }
        .tool-tensor-error-tabs {
          flex-direction: column !important;
          gap: 4px !important;
        }
        .tool-tensor-error-tabs button {
          border-bottom: 1px solid !important;
          border-radius: 2px !important;
        }
        .tool-tensor-content-grid {
          grid-template-columns: 1fr !important;
          gap: 40px !important;
        }
        .tool-tensor-preview-grid {
          grid-template-columns: 1fr !important;
          gap: 16px !important;
        }
        .tool-tensor-inner {
          padding: 0 5vw !important;
        }
      }

      /* hide hover expand-hint on touch screens */
      @media (hover: none) {
        .preview-expand-hint { display: none !important; }
      }
    `}</style>
  )
}

function Typewriter({ lines, punchline, active }) {
  const [displayed, setDisplayed] = useState([])
  const [charIdx, setCharIdx] = useState(0)
  const [lineIdx, setLineIdx] = useState(0)
  const [showPunch, setShowPunch] = useState(false)
  const rafRef = useRef(null)
  const timeRef = useRef(null)

  useEffect(() => {
    setDisplayed([])
    setCharIdx(0)
    setLineIdx(0)
    setShowPunch(false)
  }, [lines])

  useEffect(() => {
    if (!active) return
    if (lineIdx >= lines.length) {
      timeRef.current = setTimeout(() => setShowPunch(true), 400)
      return
    }
    const currentLine = lines[lineIdx]
    if (charIdx < currentLine.text.length) {
      timeRef.current = setTimeout(() => {
        setDisplayed(prev => {
          const next = [...prev]
          if (!next[lineIdx]) next[lineIdx] = { ...currentLine, text: '' }
          next[lineIdx] = { ...next[lineIdx], text: currentLine.text.slice(0, charIdx + 1) }
          return next
        })
        setCharIdx(c => c + 1)
      }, 18)
    } else {
      timeRef.current = setTimeout(() => {
        setLineIdx(l => l + 1)
        setCharIdx(0)
      }, 60)
    }
    return () => clearTimeout(timeRef.current)
  }, [active, lineIdx, charIdx, lines])

  return (
    <div style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '13px', lineHeight: '1.8' }}>
      {displayed.map((line, i) => (
        <div key={i} style={{ color: line.type === 'error' ? '#ff3b3b' : '#6b5d4e' }}>
          {line.text}
        </div>
      ))}
      {Array.from({ length: lines.length - displayed.length }).map((_, i) => (
        <div key={`ph-${i}`} style={{ height: '23.4px' }} />
      ))}
      {showPunch && (
        <div style={{ marginTop: '16px', color: '#4a3d30', borderTop: '1px solid #2a1f15', paddingTop: '12px' }}>
          {punchline}
        </div>
      )}
    </div>
  )
}


function ErrorSelector({ scenarios, visible }) {
  const [active, setActive] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setRunning(true), 300)
      return () => clearTimeout(t)
    }
  }, [visible])

  const handleSelect = (i) => {
    if (i === active) return
    setRunning(false)
    setTimeout(() => {
      setActive(i)
      setRunning(true)
    }, 80)
  }

  return (
    <div>

      <div className="tool-tensor-error-tabs" style={{ display: 'flex', gap: '2px', marginBottom: '0', position: 'relative' }}>
        {scenarios.map((s, i) => (
          <button
            key={s.id}
            onClick={() => handleSelect(i)}
            style={{
              flex: 1,
              padding: '10px 12px',
              background: i === active ? '#1a1108' : 'transparent',
              border: '1px solid',
              borderBottom: 'none',
              borderColor: i === active ? '#d39a1f' : '#2a1f15',
              color: i === active ? '#d39a1f' : '#4a3d30',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              position: 'relative',
            }}
          >
            <span style={{ fontSize: '14px', opacity: i === active ? 1 : 0.5 }}>{s.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '9px', color: i === active ? '#d39a1f' : '#3a2d20', marginBottom: '1px' }}>{s.tag}</div>
              <div>{s.label}</div>
            </div>
            {i === active && (
              <div style={{
                position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '1px',
                background: '#1a1108',
              }} />
            )}
          </button>
        ))}
      </div>

   
      <div style={{
        background: '#0f0b07',
        border: '1px solid #d39a1f',
        borderTop: '1px solid #e8650a',
        padding: '0',
        borderRadius: '0 0 4px 4px',
      }}>
       
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 16px',
          borderBottom: '1px solid #1f150a',
          background: '#0d0905',
        }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4a3d30', marginLeft: '8px' }}>
            neuralveil ~ tensor-debug
          </span>
        </div>
        <div style={{ padding: '20px 24px', minHeight: '140px' }}>
          <Typewriter
            lines={scenarios[active].lines}
            punchline={scenarios[active].punchline}
            active={running}
          />
        </div>
      </div>
    </div>
  )
}


function FeatureCards({ features, accentColor }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <div>
      <p style={{
        fontFamily: 'monospace', fontSize: '11px',
        color: '#4a3d30', letterSpacing: '0.12em', marginBottom: '20px',
      }}>
        // capabilities
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {features.map((f, i) => {
          const isOpen = expanded === f.id
          return (
            <div
              key={f.id}
              onClick={() => setExpanded(isOpen ? null : f.id)}
              style={{
                border: `1px solid ${isOpen ? accentColor : '#2a1f15'}`,
                background: isOpen ? 'rgba(232,101,10,0.06)' : 'rgba(255,255,255,0.01)',
                padding: '14px 18px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
         
              <div style={{
                position: 'absolute', top: 0, left: 0,
                width: '3px', height: isOpen ? '100%' : '40%',
                background: accentColor,
                transition: 'height 0.3s ease',
              }} />
              <div style={{
                position: 'absolute', top: 0, left: 0,
                width: isOpen ? '100%' : '30%', height: '1px',
                background: `linear-gradient(90deg, ${accentColor}, transparent)`,
                transition: 'width 0.4s ease',
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '10px' }}>
                <span style={{
                  fontFamily: 'monospace', fontSize: '9px',
                  color: accentColor, letterSpacing: '0.15em',
                  opacity: 0.7,
                }}>F{String(i + 1).padStart(2, '0')}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontFamily: 'monospace', fontSize: '13px',
                      color: isOpen ? '#e8d5b0' : '#9a8060',
                      letterSpacing: '0.05em',
                      fontWeight: isOpen ? '600' : '400',
                    }}>{f.label}</span>
                    <span style={{
                      fontFamily: 'monospace', fontSize: '10px',
                      color: isOpen ? accentColor : '#3a2d20',
                    }}>{f.short}</span>
                    <span style={{
                      fontFamily: 'monospace', fontSize: '14px',
                      color: isOpen ? accentColor : '#3a2d20',
                      marginLeft: '8px',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
                      display: 'inline-block',
                      transition: 'transform 0.2s',
                    }}>+</span>
                  </div>
                  {isOpen && (
                    <p style={{
                      fontFamily: 'monospace', fontSize: '12px',
                      color: '#8a7050', lineHeight: 1.8,
                      margin: '10px 0 0', paddingTop: '10px',
                      borderTop: '1px solid #1f150a',
                    }}>{f.desc}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


// ── Shared modal styles injected once ─────────────────────────────────────────
function ModalStyles() {
  return (
    <style>{`
      @keyframes modalFadeIn  { from { opacity: 0 }              to { opacity: 1 } }
      @keyframes modalSlideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      @keyframes modalSlideUpMobile { from { opacity: 0; transform: translateY(40px) } to { opacity: 1; transform: translateY(0) } }

      .modal-close-btn {
        background: none;
        border: 1px solid #2a1f15;
        color: #d39a1f;
        width: 36px; height: 36px;
        min-width: 36px;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-family: monospace; font-size: 16px; line-height: 1;
        transition: all 0.15s;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      .modal-close-btn:hover  { background: rgba(211,154,31,0.12); border-color: #d39a1f; }
      .modal-close-btn:active { background: rgba(211,154,31,0.22); }

      /* Image modal grid: multi-col on desktop, single-col on mobile */
      .img-modal-grid-2 { grid-template-columns: 1fr 1fr !important; }
      .img-modal-grid-3 { grid-template-columns: 1fr 1fr 1fr !important; }

      @media (max-width: 640px) {
        .img-modal-grid-2,
        .img-modal-grid-3 { grid-template-columns: 1fr !important; }

        .modal-inner {
          /* full-width bottom-sheet on mobile */
          position: fixed !important;
          bottom: 0 !important; left: 0 !important; right: 0 !important;
          top: auto !important;
          max-width: 100% !important;
          width: 100% !important;
          border-radius: 0 !important;
          border-left: none !important; border-right: none !important; border-bottom: none !important;
          border-top: 2px solid #d39a1f !important;
          max-height: 88vh !important;
          animation: modalSlideUpMobile 0.28s cubic-bezier(0.32,0.72,0,1) !important;
        }

        .modal-overlay {
          align-items: flex-end !important;
          padding: 0 !important;
        }

        .modal-images-scroll {
          padding: 14px !important;
          max-height: calc(88vh - 52px) !important;
        }

        .modal-img-max { max-height: 55vw !important; }
      }
    `}</style>
  )
}

// ── Shared modal header strip ──────────────────────────────────────────────────
function ModalHeader({ title, pulseDot, onClose }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px',
      borderBottom: '1px solid #1f150a',
      background: '#0d0905',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%', background: '#d39a1f',
          display: 'inline-block', flexShrink: 0,
          ...(pulseDot ? { animation: 'pulse 1.2s ease-in-out infinite' } : { opacity: 0.8 }),
        }} />
        <span style={{
          fontFamily: 'monospace', fontSize: '10px', color: '#d39a1f',
          letterSpacing: '0.12em', overflow: 'scroll', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title}
        </span>
      </div>
      <button className="modal-close-btn" onClick={onClose}>✕</button>
    </div>
  )
}

// ── Modal overlay for image previews — carousel/slideshow ─────────────────────
function ImageModal({ open, onClose, images, initialIndex = 0 }) {
  const [current, setCurrent] = useState(initialIndex)

  // sync when modal opens at a specific index
  useEffect(() => {
    if (open) setCurrent(initialIndex)
  }, [open, initialIndex])

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setCurrent(c => (c + 1) % images.length)
      if (e.key === 'ArrowLeft') setCurrent(c => (c - 1 + images.length) % images.length)
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'scroll'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose, images.length])

  if (!open) return null

  const img = images[current]
  const hasPrev = images.length > 1
  const hasNext = images.length > 1

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(5, 3, 1, 0.95)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'modalFadeIn 0.2s ease',
      }}
    >
      <div
        className="modal-inner"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a0704',
          border: '1px solid #d39a1f',
          maxWidth: '960px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          animation: 'modalSlideUp 0.25s ease',
          boxShadow: '0 0 60px rgba(211,154,31,0.15), 0 0 140px rgba(211,154,31,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* corner accents */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, borderLeft: '12px solid #d39a1f', borderBottom: '12px solid transparent', zIndex: 3, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 0, height: 0, borderRight: '12px solid #d39a1f', borderTop: '12px solid transparent', zIndex: 3, pointerEvents: 'none' }} />

        {/* Header with slide counter */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid #1f150a',
          background: '#0d0905',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d39a1f', opacity: 0.8, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#d39a1f', letterSpacing: '0.12em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {img.label || '// preview'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {images.length > 1 && (
              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4a3d30', letterSpacing: '0.1em' }}>
                {String(current + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
              </span>
            )}
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Image area with nav arrows */}
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: '#080503', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
          {/* top accent line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, #d39a1f, transparent)', zIndex: 1 }} />

          {/* Prev arrow */}
          {hasPrev && (
            <button
              onClick={() => setCurrent(c => (c - 1 + images.length) % images.length)}
              style={{
                position: 'absolute', left: '12px', zIndex: 5,
                background: 'rgba(13,9,5,0.85)', border: '1px solid #2a1f15',
                color: '#d39a1f', width: '40px', height: '40px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontFamily: 'monospace', fontSize: '18px',
                transition: 'all 0.15s', lineHeight: 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#d39a1f'; e.currentTarget.style.background = 'rgba(211,154,31,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a1f15'; e.currentTarget.style.background = 'rgba(13,9,5,0.85)' }}
            >
              ‹
            </button>
          )}

          {/* Image */}
          {img.src ? (
            <img
              key={current}
              src={img.src}
              alt={img.label}
              style={{
                maxWidth: '100%', maxHeight: '75vh',
                objectFit: 'contain', display: 'block',
                animation: 'modalFadeIn 0.18s ease',
              }}
            />
          ) : (
            <div style={{
              width: '100%', minHeight: '320px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: '#4a3d30', fontFamily: 'monospace', fontSize: '11px', gap: '8px',
            }}>
              <span style={{ fontSize: '24px', opacity: 0.3 }}>◈</span>
              <span>[ DEVELOPMENT IN PROGRESS ]</span>
            </div>
          )}

          {/* Next arrow */}
          {hasNext && (
            <button
              onClick={() => setCurrent(c => (c + 1) % images.length)}
              style={{
                position: 'absolute', right: '12px', zIndex: 5,
                background: 'rgba(13,9,5,0.85)', border: '1px solid #2a1f15',
                color: '#d39a1f', width: '40px', height: '40px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontFamily: 'monospace', fontSize: '18px',
                transition: 'all 0.15s', lineHeight: 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#d39a1f'; e.currentTarget.style.background = 'rgba(211,154,31,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a1f15'; e.currentTarget.style.background = 'rgba(13,9,5,0.85)' }}
            >
              ›
            </button>
          )}
        </div>

        {/* Dot indicators */}
        {images.length > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '6px', padding: '10px 14px',
            borderTop: '1px solid #1f150a', background: '#0d0905', flexShrink: 0,
          }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  width: i === current ? '20px' : '6px',
                  height: '6px',
                  background: i === current ? '#d39a1f' : '#2a1f15',
                  border: 'none', cursor: 'pointer',
                  padding: 0, transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Clickable preview thumbnail ────────────────────────────────────────────────
function PreviewThumb({ children, onClick, borderColor = '#2a1f15', accentDir = 'top' }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered ? '#d39a1f' : borderColor}`,
        background: '#0d0905',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: hovered ? '0 0 18px rgba(211,154,31,0.12)' : 'none',
      }}
    >
      {accentDir === 'top' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, #d39a1f, transparent)`, zIndex: 1 }} />
      )}
      {accentDir === 'right' && (
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '2px', background: `linear-gradient(180deg, #d39a1f, transparent)`, zIndex: 1 }} />
      )}
      {/* zoom hint on hover */}
      {hovered && (
        <div className="preview-expand-hint" style={{
          position: 'absolute', inset: 0, zIndex: 3,
          background: 'rgba(10,7,4,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'opacity 0.2s',
        }}>
          <div style={{
            border: '1px solid #d39a1f',
            padding: '6px 14px',
            fontFamily: 'monospace', fontSize: '10px', color: '#d39a1f',
            letterSpacing: '0.15em', background: 'rgba(13,9,5,0.85)',
          }}>
            [ EXPAND ]
          </div>
        </div>
      )}
      {children}
    </div>
  )
}

function PreviewSection({ img1Src, img2Src, img3Src, img4Src, img5Src, img1Label, img2Label, img3Label, img4Label, img5Label }) {
  const [carouselOpen, setCarouselOpen] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [activeImages, setActiveImages] = useState([])

  const openCarousel = (images, index = 0) => {
    setActiveImages(images)
    setCarouselIndex(index)
    setCarouselOpen(true)
  }

  return (
    <div style={{ marginTop: '80px' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      <ModalStyles />

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '32px', height: '1px', background: '#2a1f15' }} />
        <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4a3d30', letterSpacing: '0.12em', margin: 0 }}>
          // preview
        </p>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #2a1f15, transparent)' }} />
      </div>

      <div className="tool-tensor-preview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'stretch' }}>

        {/* Image 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <PreviewThumb onClick={() => openCarousel([{ src: img1Src, label: img1Label }, {src: img2Src, label: img2Label}], 0)} accentDir="top">
            <div style={{ aspectRatio: '4/3' }}>
              {img1Src ? (
                <img src={img1Src} alt={img1Label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C5C5C7', fontFamily: 'monospace', fontSize: '11px' }}>
                  [ DEVELOPMENT IN PROGRESS ]
                </div>
              )}
            </div>
          </PreviewThumb>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#3a2d20', letterSpacing: '0.08em' }}>
            {img1Label}
          </span>
        </div>

        {/* Image 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <PreviewThumb onClick={() => openCarousel([{ src: img3Src, label: img3Label }, { src: img4Src, label: img4Label }, { src: img5Src, label: img5Label }], 0)} accentDir="right">
            <div style={{ aspectRatio: '4/3' }}>
              {img2Src ? (
                <img src={img2Src} alt={img2Label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C5C5C7', fontFamily: 'monospace', fontSize: '11px' }}>
                  [ DEVELOPMENT IN PROGRESS ]
                </div>
              )}
            </div>
          </PreviewThumb>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#3a2d20', letterSpacing: '0.08em' }}>
            {img2Label}
          </span>
        </div>

      </div>

      {/* Single carousel modal for all images */}
      <ImageModal
        open={carouselOpen}
        onClose={() => setCarouselOpen(false)}
        images={activeImages}
        initialIndex={carouselIndex}
      />
    </div>
  )
}


export default function ToolTensor() {
  const { ref: sectionRef, hasIntersected } = useIntersectionObserver({ threshold: 0.05 })
  const { ref: errorRef, hasIntersected: errorVisible } = useIntersectionObserver({ threshold: 0.2 })

  return (
    <section
      id="tools"
      ref={sectionRef}
      className="tool-tensor-section"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '140px 0 120px',
        backgroundColor: 'var(--void)',
      }}
    >
      <MobileStyles />
      
      <div
        className="font-bebas tool-tensor-watermark"
        style={{
          fontSize: 'clamp(80px, 12vw, 160px)',
          color: 'rgba(232, 101, 10, 0.04)',
          letterSpacing: '0.04em',
          pointerEvents: 'none', userSelect: 'none',
          whiteSpace: 'nowrap', lineHeight: 1,
        }}
      >
        TENSOR DEBUG
      </div>


      <div style={{
        position: 'absolute', right: '-80px', top: '50%',
        transform: 'translateY(-50%)', pointerEvents: 'none',
      }}>
        <DendriteField opacity={0.05} width={400} height={600} />
      </div>

      <div
        className="tool-tensor-inner"
        style={{
        position: 'relative', zIndex: 2,
        maxWidth: '1200px', margin: '0 auto', padding: '0 8vw',
      }}>
       
        <div
          className="tool-tensor-header"
          style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          marginBottom: '56px',
          opacity: hasIntersected ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}>
          <div style={{ width: '32px', height: '2px', backgroundColor: 'var(--ember)' }} />
          <span className="font-mono-jb" style={{ fontSize: '11px', color: 'var(--ember)', letterSpacing: '0.15em' }}>
            TOOL 01
          </span>
          <h2 className="font-bebas" style={{
            fontSize: 'clamp(32px, 4vw, 52px)',
            color: '#ede8e0', letterSpacing: '0.04em', margin: 0,
          }}>
            TENSOR SHAPE DEBUGGER
          </h2>
        </div>

  
        <div
          ref={errorRef}
          className="tool-tensor-error-section"
          style={{
            marginBottom: '80px',
            opacity: hasIntersected ? 1 : 0,
            transform: hasIntersected ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.7s ease 0.2s',
          }}
        >
          <p style={{
            fontFamily: 'monospace', fontSize: '11px',
            color: '#4a3d30', letterSpacing: '0.12em', marginBottom: '16px',
          }}>
            // select an error you've seen before
          </p>
          <ErrorSelector scenarios={tensorErrorScenarios} visible={errorVisible} />
        </div>

    
        <div
          className="tool-tensor-content-grid"
          style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '80px',
          alignItems: 'start',
          opacity: hasIntersected ? 1 : 0,
          transform: hasIntersected ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.7s ease 0.4s',
        }}>
        
          <div>
            <p className="font-mono-jb" style={{
              fontSize: '11px', color: 'var(--ash)',
              letterSpacing: '0.12em', marginBottom: '20px',
            }}>
              // how neuralveil fixes this
            </p>
            <p className="font-mono-jb" style={{
              fontSize: '14px', lineHeight: '1.9',
              color: '#b8a890', marginBottom: '36px',
            }}>
              The Tensor Shape Debugger traces dimensions at every operation,
              builds a visual shape-flow graph across your architecture,
              and catches mismatches before runtime. Silent reshape bugs
              that corrupt results without crashing — caught, annotated, and surfaced.
            </p>
          </div>

         
          <FeatureCards features={tensorFeatures} accentColor="#d39a1f" />
        </div>

   
        <div style={{
          opacity: hasIntersected ? 1 : 0,
          transform: hasIntersected ? 'translateY(0)' : 'translateY(32px)',
          transition: 'all 0.8s ease 0.6s',
        }}>
          <PreviewSection
            img1Src={nvtsdimg1}
            img2Src={nvtsdimg2}
            img3Src={nvtsdimg3}
            img4Src={nvtsdimg4}
            img5Src={nvtsdimg5}
            img1Label="// mismatch annotation"
            img2Label="// dimension graph"
            img3Label="// dimension graph"
            img4Label="// dimension graph"
            img5Label="// dimension graph"
          />
        </div>
      </div>
    </section>
  )
}