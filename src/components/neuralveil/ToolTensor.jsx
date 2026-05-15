import { useState, useEffect, useRef } from 'react'
import { useIntersectionObserver } from '../hooks/useIntersectionObserver'
import DendriteField from '../../assets/svgs/DendriteField'

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
      {/* Selector tabs */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '0', position: 'relative' }}>
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
              borderColor: i === active ? '#e8650a' : '#2a1f15',
              color: i === active ? '#e8650a' : '#4a3d30',
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
              <div style={{ fontSize: '9px', color: i === active ? '#f07820' : '#3a2d20', marginBottom: '1px' }}>{s.tag}</div>
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

      {/* Terminal */}
      <div style={{
        background: '#0f0b07',
        border: '1px solid #e8650a',
        borderTop: '1px solid #e8650a',
        padding: '0',
        borderRadius: '0 0 4px 4px',
      }}>
        {/* Terminal bar */}
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

/* ─── FEATURE CARDS ──────────────────────────────────────────────────────── */
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
              {/* Cyberpunk corner accent */}
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

/* ─── PREVIEW SECTION ────────────────────────────────────────────────────── */
function PreviewSection({ gifSrc, img1Src, img2Src, gifLabel, img1Label, img2Label }) {
  return (
    <div style={{ marginTop: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '32px', height: '1px', background: '#2a1f15' }} />
        <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4a3d30', letterSpacing: '0.12em', margin: 0 }}>
          // preview
        </p>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #2a1f15, transparent)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.6fr', gap: '12px', alignItems: 'stretch' }}>
        {/* Image 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            border: '1px solid #2a1f15',
            background: '#0d0905',
            overflow: 'hidden',
            position: 'relative',
            aspectRatio: '4/3',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: '2px', background: 'linear-gradient(90deg, #e8650a, transparent)',
            }} />
            {img1Src ? (
              <img src={img1Src} alt={img1Label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: '#C5C5C7', fontFamily: 'monospace', fontSize: '11px',
              }}>[ DEVELOPMENT IN PROGRESS ]</div>
            )}
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#3a2d20', letterSpacing: '0.08em' }}>
            {img1Label}
          </span>
        </div>

        {/* Image 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            border: '1px solid #2a1f15',
            background: '#0d0905',
            overflow: 'hidden',
            position: 'relative',
            aspectRatio: '4/3',
          }}>
            <div style={{
              position: 'absolute', top: 0, right: 0, bottom: 0,
              width: '2px', background: 'linear-gradient(180deg, #e8650a, transparent)',
            }} />
            {img2Src ? (
              <img src={img2Src} alt={img2Label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: '#C5C5C7', fontFamily: 'monospace', fontSize: '11px',
              }}>[ DEVELOPMENT IN PROGRESS ]</div>
            )}
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#3a2d20', letterSpacing: '0.08em' }}>
            {img2Label}
          </span>
        </div>

        {/* GIF — bigger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            border: '1px solid #e8650a',
            background: '#0d0905',
            overflow: 'hidden',
            position: 'relative',
            flex: 1,
            minHeight: '200px',
          }}>
            {/* Corner cuts — cyberpunk */}
            <div style={{
              position: 'absolute', top: 0, left: 0,
              width: 0, height: 0,
              borderLeft: '12px solid #e8650a',
              borderBottom: '12px solid transparent',
              zIndex: 2,
            }} />
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 0, height: 0,
              borderRight: '12px solid #e8650a',
              borderTop: '12px solid transparent',
              zIndex: 2,
            }} />
            {/* Live badge */}
            <div style={{
              position: 'absolute', top: '10px', right: '10px', zIndex: 3,
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(15,11,7,0.85)',
              border: '1px solid #e8650a',
              padding: '3px 8px',
              fontFamily: 'monospace', fontSize: '9px', color: '#e8650a',
              letterSpacing: '0.1em',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#e8650a',
                animation: 'pulse 1.2s ease-in-out infinite',
              }} />
              LIVE
            </div>
            {gifSrc ? (
              <img
                src={gifSrc}
                alt={gifLabel}
                loop
                autoPlay
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%', minHeight: '200px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                color: '#C5C5C7', fontFamily: 'monospace', fontSize: '11px', gap: '8px',
              }}>
                <span style={{ fontSize: '24px', opacity: 0.3 }}>▶</span>
                <span>[ DEVELOPMENT IN PROGRESS ]</span>
              </div>
            )}
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#3a2d20', letterSpacing: '0.08em' }}>
            {gifLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
export default function ToolTensor() {
  const { ref: sectionRef, hasIntersected } = useIntersectionObserver({ threshold: 0.05 })
  const { ref: errorRef, hasIntersected: errorVisible } = useIntersectionObserver({ threshold: 0.2 })

  return (
    <section
      id="tools"
      ref={sectionRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '140px 0 120px',
        backgroundColor: 'var(--void)',
      }}
    >
      {/* Watermark */}
      <div
        className="font-bebas"
        style={{
          position: 'absolute', top: '40px', left: '-20px',
          fontSize: 'clamp(80px, 12vw, 160px)',
          color: 'rgba(232, 101, 10, 0.04)',
          letterSpacing: '0.04em',
          pointerEvents: 'none', userSelect: 'none',
          whiteSpace: 'nowrap', lineHeight: 1,
        }}
      >
        TENSOR DEBUG
      </div>

      {/* Dendrite bg */}
      <div style={{
        position: 'absolute', right: '-80px', top: '50%',
        transform: 'translateY(-50%)', pointerEvents: 'none',
      }}>
        <DendriteField opacity={0.05} width={400} height={600} />
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        maxWidth: '1200px', margin: '0 auto', padding: '0 8vw',
      }}>
        {/* Header */}
        <div style={{
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

        {/* ① Error Selector */}
        <div
          ref={errorRef}
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

        {/* ② Features + Description grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '80px',
          alignItems: 'start',
          opacity: hasIntersected ? 1 : 0,
          transform: hasIntersected ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.7s ease 0.4s',
        }}>
          {/* Description */}
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

          {/* Feature cards */}
          <FeatureCards features={tensorFeatures} accentColor="#e8650a" />
        </div>

        {/* ③ Preview Section */}
        <div style={{
          opacity: hasIntersected ? 1 : 0,
          transform: hasIntersected ? 'translateY(0)' : 'translateY(32px)',
          transition: 'all 0.8s ease 0.6s',
        }}>
          <PreviewSection
            gifSrc={null}
            img1Src={null}
            img2Src={null}
            gifLabel="// shape-flow live trace"
            img1Label="// mismatch annotation"
            img2Label="// dimension graph"
          />
        </div>
      </div>
    </section>
  )
}