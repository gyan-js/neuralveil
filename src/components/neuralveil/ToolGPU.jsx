import { useState, useEffect, useRef } from 'react'
import { useIntersectionObserver } from '../hooks/useIntersectionObserver'
import ForgeCircuit from '../../assets/svgs/ForgeCircuit'


const gpuErrorScenarios = [
  {
    id: 'oom',
    label: 'OOM Crash',
    icon: '◼',
    tag: 'ERR_01',
    lines: [
      { text: 'CUDA out of memory. Tried to allocate 2.50 GiB', type: 'error' },
      { text: '  (GPU 0; 10.76 GiB total capacity; 8.91 GiB already allocated)', type: 'muted' },
      { text: 'killed after 4 hours of training — batch size was too large', type: 'error' },
      { text: '  you found out at epoch 3. the run is gone.', type: 'muted' },
    ],
    punchline: "// you've been here.",
  },
  {
    id: 'underestimate',
    label: 'VRAM Undercount',
    icon: '◧',
    tag: 'ERR_02',
    lines: [
      { text: 'estimated: ~6GB. actual: 14.2GB.', type: 'error' },
      { text: '  optimizer states, activations, gradients — you forgot all three.', type: 'muted' },
      { text: 'RuntimeError: CUDA error: device-side assert triggered', type: 'error' },
      { text: '  memory fragmentation from previous failed run. restart.', type: 'muted' },
    ],
    punchline: '// the estimate was a guess. a bad one.',
  },
  {
    id: 'fragmentation',
    label: 'Fragmentation',
    icon: '◫',
    tag: 'ERR_03',
    lines: [
      { text: 'torch.cuda.OutOfMemoryError: CUDA out of memory.', type: 'error' },
      { text: '  Tried to allocate 512 MiB — only 600 MiB free, but fragmented.', type: 'muted' },
      { text: 'total memory: 9.2 GB. largest free block: 487 MB.', type: 'error' },
      { text: '  your allocator is swiss cheese. reduce batch or restart.', type: 'muted' },
    ],
    punchline: '// free memory means nothing if it\'s shattered.',
  },
]

const gpuFeatures = [
  {
    id: 'precompute',
    label: 'VRAM Pre-compute',
    short: 'Before first forward pass.',
    desc: 'Pre-computes total VRAM requirements — weights, optimizer states, activation memory, gradient buffers — before a single forward pass runs. Know your real footprint upfront.',
  },
  {
    id: 'breakdown',
    label: 'Memory Breakdown',
    short: 'Per-component split.',
    desc: 'Breaks VRAM usage into model weights, optimizer states (Adam = 2x params), activation checkpoints, and gradient buffers separately — so you know exactly where your memory goes.',
  },
  {
    id: 'batchsim',
    label: 'Batch Simulator',
    short: 'Test before committing.',
    desc: 'Simulates memory usage across different batch sizes and precision modes (fp32/fp16/bf16) without running a single training step.',
  },
  {
    id: 'gradient-check',
    label: 'Gradient Checkpoint Advisor',
    short: 'Trade compute for RAM.',
    desc: 'Models memory savings from gradient checkpointing — see exact VRAM reduction before enabling it in your config.',
  },
  {
    id: 'alert',
    label: 'OOM Predictor',
    short: 'Catch before epoch 3.',
    desc: 'Flags configurations likely to OOM based on static memory estimates — catch doomed runs before they start.',
  },
]

function Typewriter({ lines, punchline, active }) {
  const [displayed, setDisplayed] = useState([])
  const [charIdx, setCharIdx] = useState(0)
  const [lineIdx, setLineIdx] = useState(0)
  const [showPunch, setShowPunch] = useState(false)
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

  const accent = '#f07820'

  return (
    <div>
      <div style={{ display: 'flex', gap: '2px', marginBottom: '0' }}>
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
              borderColor: i === active ? accent : '#2a1f15',
              color: i === active ? accent : '#4a3d30',
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
              <div style={{ fontSize: '9px', color: i === active ? accent : '#3a2d20', marginBottom: '1px' }}>{s.tag}</div>
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
        border: `1px solid ${accent}`,
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
            neuralveil ~ gpu-estimate
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
                background: isOpen ? 'rgba(240,120,32,0.06)' : 'rgba(255,255,255,0.01)',
                padding: '14px 18px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute', top: 0, right: 0,
                width: '3px', height: isOpen ? '100%' : '40%',
                background: accentColor,
                transition: 'height 0.3s ease',
              }} />
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: isOpen ? '100%' : '30%', height: '1px',
                background: `linear-gradient(270deg, ${accentColor}, transparent)`,
                transition: 'width 0.4s ease',
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '10px' }}>
                <span style={{
                  fontFamily: 'monospace', fontSize: '9px',
                  color: accentColor, letterSpacing: '0.15em', opacity: 0.7,
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


function PreviewSection({ gifSrc, img1Src, img2Src, gifLabel, img1Label, img2Label }) {
  return (
    <div style={{ marginTop: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(270deg, #2a1f15, transparent)' }} />
        <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4a3d30', letterSpacing: '0.12em', margin: 0 }}>
          // preview
        </p>
        <div style={{ width: '32px', height: '1px', background: '#2a1f15' }} />
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: '12px', alignItems: 'stretch' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            border: '1px solid #f07820',
            background: '#0d0905',
            overflow: 'hidden',
            position: 'relative',
            flex: 1,
            minHeight: '200px',
          }}>
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: 0, height: 0,
              borderRight: '12px solid #f07820',
              borderBottom: '12px solid transparent',
              zIndex: 2,
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0,
              width: 0, height: 0,
              borderLeft: '12px solid #f07820',
              borderTop: '12px solid transparent',
              zIndex: 2,
            }} />
            <div style={{
              position: 'absolute', top: '10px', left: '10px', zIndex: 3,
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(15,11,7,0.85)',
              border: '1px solid #f07820',
              padding: '3px 8px',
              fontFamily: 'monospace', fontSize: '9px', color: '#f07820',
              letterSpacing: '0.1em',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#f07820',
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
              height: '2px', background: 'linear-gradient(90deg, transparent, #f07820)',
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

    
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            border: '1px solid #2a1f15',
            background: '#0d0905',
            overflow: 'hidden',
            position: 'relative',
            aspectRatio: '4/3',
          }}>
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: '2px', background: 'linear-gradient(90deg, transparent, #f07820)',
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
      </div>
    </div>
  )
}


export default function ToolGPU() {
  const { ref: sectionRef, hasIntersected } = useIntersectionObserver({ threshold: 0.05 })
  const { ref: errorRef, hasIntersected: errorVisible } = useIntersectionObserver({ threshold: 0.2 })

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '140px 0 120px',
        backgroundColor: 'var(--forge-deep)',
      }}
    >
   
      <div
        className="font-bebas"
        style={{
          position: 'absolute', top: '40px', right: '-20px',
          fontSize: 'clamp(80px, 12vw, 160px)',
          color: 'rgba(240, 120, 32, 0.04)',
          letterSpacing: '0.04em',
          pointerEvents: 'none', userSelect: 'none',
          whiteSpace: 'nowrap', lineHeight: 1, textAlign: 'right',
        }}
      >
        GPU MEMORY
      </div>


      <div style={{
        position: 'absolute', left: '-80px', top: '50%',
        transform: 'translateY(-50%)', pointerEvents: 'none',
      }}>
        <ForgeCircuit opacity={0.05} width={500} height={600} animate={true} />
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        maxWidth: '1200px', margin: '0 auto', padding: '0 8vw',
      }}>
  
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          marginBottom: '56px', justifyContent: 'flex-end',
          opacity: hasIntersected ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}>
          <h2 className="font-bebas" style={{
            fontSize: 'clamp(32px, 4vw, 52px)',
            color: '#ede8e0', letterSpacing: '0.04em', margin: 0,
          }}>
            GPU MEMORY ESTIMATOR
          </h2>
          <span className="font-mono-jb" style={{ fontSize: '11px', color: 'var(--ember)', letterSpacing: '0.15em' }}>
            TOOL 02
          </span>
          <div style={{ width: '32px', height: '2px', backgroundColor: 'var(--ember)' }} />
        </div>

     
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
            textAlign: 'right',
          }}>
            // select an error you've seen before
          </p>
          <ErrorSelector scenarios={gpuErrorScenarios} visible={errorVisible} />
        </div>


        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '80px',
          alignItems: 'start',
          opacity: hasIntersected ? 1 : 0,
          transform: hasIntersected ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.7s ease 0.4s',
        }}>
 
          <FeatureCards features={gpuFeatures} accentColor="#f07820" />

      
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
              The GPU Memory Estimator pre-computes VRAM requirements across
              model weights, optimizer states, activation memory, and gradient buffers —
              before a single forward pass runs. Know exactly what you need
              before committing to a four-hour run that dies at epoch 3.
            </p>
          </div>
        </div>

  
        <div style={{
          opacity: hasIntersected ? 1 : 0,
          transform: hasIntersected ? 'translateY(0)' : 'translateY(32px)',
          transition: 'all 0.8s ease 0.6s',
        }}>
          <PreviewSection
            gifSrc={null}
            img1Src={null}
            img2Src={null}
            gifLabel="// vram breakdown live"
            img1Label="// batch size simulation"
            img2Label="// oom prediction overlay"
          />
        </div>
      </div>
    </section>
  )
}