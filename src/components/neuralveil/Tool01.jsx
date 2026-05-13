import React, { useState } from 'react'
import { useInView } from '../hooks/useInView.js'
import DiagLabel from './DiagLabel.jsx'
import {useNavigate} from 'react-router'
/* ─── PROBLEM TERMINAL SNIPPETS ──────────────────────────────── */
const PROBLEMS = [
  {
    id: 'P-01',
    title: 'Silent Shape Crashes',
    snippet: `Traceback (most recent call last):
  File "train.py", line 47, in forward
    x = self.fc(x)
RuntimeError: mat1 and mat2 shapes cannot be multiplied
  (32×512) and (1024×10)

>>> # You stare at 47 layers. The mismatch is at layer 31.
>>> # PyTorch tells you WHERE it crashed. Not WHY.`,
    color: '#ff2020',
  },
  {
    id: 'P-02',
    title: 'Reshape Dimension Hell',
    snippet: `# After adding a new branch to your model:
>>> output = model(x)
RuntimeError: Expected 4D tensor but got 3D for argument #1
  'input' in operator conv2d

>>> # You added ONE layer three days ago.
>>> # You have no idea which reshape broke the chain.`,
    color: '#ff5e1a',
  },
  {
    id: 'P-03',
    title: 'Batch Size Ambiguity',
    snippet: `# Works on batch=1. Explodes on batch=32.
AssertionError: Tensor shape mismatch in skip connection
  Expected: [32, 256, 14, 14]
  Got:      [32, 256, 13, 13]

>>> # Off by one. Could be anywhere in 60 layers.
>>> # print() debugging for 4 hours. Again.`,
    color: '#ffb300',
  },
]

/* ─── SOLUTION STEPS ──────────────────────────────────────────── */
const SOLUTION_STEPS = [
  { step: '01', label: 'PASTE MODEL', desc: 'Drop your PyTorch nn.Module definition — NV-TSD parses the raw source.', icon: '◈' },
  { step: '02', label: 'AST PARSE', desc: 'Python AST engine traces every layer, skip connection, and reshape call.', icon: '◉' },
  { step: '03', label: 'SHAPE TRACE', desc: 'Tensor dimensions are propagated forward through every branch simultaneously.', icon: '⬡' },
  { step: '04', label: 'ERROR PINPOINT', desc: 'Exact mismatch layer highlighted — with a fix suggestion, not just a stack trace.', icon: '◇' },
]

/* ─── FEATURES ────────────────────────────────────────────────── */
const FEATURES = [
  {
    id: 'F-01',
    icon: '◈',
    label: 'AST-BASED PARSER',
    badge: 'CORE ENGINE',
    badgeColor: '#c9a84c',
    desc: 'Parses model source with Python\'s AST module — no dummy input required. Understands nn.Sequential, custom forward(), branching, and nested modules.',
    detail: 'Zero runtime. Works on incomplete models.',
  },
  {
    id: 'F-02',
    icon: '◉',
    label: 'SHAPE PROPAGATION',
    badge: 'LAYER-LEVEL',
    badgeColor: '#ff5e1a',
    desc: 'Tracks tensor dimensions at every boundary. Conv → BN → ReLU → Pool chains are fully traced including stride, padding, and dilation effects.',
    detail: 'Handles 2D, 3D, 4D tensors.',
  },
  {
    id: 'F-03',
    icon: '⬡',
    label: 'SKIP CONNECTION TRACING',
    badge: 'UNIQUE',
    badgeColor: '#00e5ff',
    desc: 'Residual paths, dense connections, and multi-branch architectures are resolved correctly — both branches traced independently, then merged.',
    detail: 'ResNet, DenseNet, UNet patterns.',
  },
  {
    id: 'F-04',
    icon: '◇',
    label: 'ERROR + FIX SUGGESTION',
    badge: 'ACTIONABLE',
    badgeColor: '#ff2020',
    desc: 'When a mismatch is found, NV-TSD explains the expected vs actual shape, names the layer, and suggests the exact code fix.',
    detail: 'No more 4-hour print() sessions.',
  },
]

/* ─── TRACE TERMINAL OUTPUT ───────────────────────────────────── */
const TRACE_OUTPUT = `# NeuralVeil Tensor Tracer v0.9.1
>>> import neuralveil as nv
>>> tracer = nv.TensorTracer(model)
>>> tracer.trace(input_shape=(1, 3, 224, 224))

TRACE INITIATED —————————————————————
Layer[0]  Conv2d           [1,3,224,224]   → [1,64,112,112]
Layer[1]  BatchNorm2d      [1,64,112,112]  → [1,64,112,112]
Layer[2]  ReLU             [1,64,112,112]  → [1,64,112,112]
Layer[3]  MaxPool2d        [1,64,112,112]  → [1,64,56,56]
Layer[4]  BasicBlock       [1,64,56,56]   → [1,64,56,56]
Layer[5]  BasicBlock       [1,64,56,56]   → [1,128,28,28]

! ERROR ——————————————————————————————
Layer[6]  Linear           [1,512]         ×  [1,1024]

  ShapeMismatch: expected input (1, 512)
  got (1, 1024) — reshape or verify
  flatten layer output dims

  Suggestion: (u get the whole structure visualized in a graph)
—————————————————————————————————————`

/* ─── NODE GRAPH DATA ─────────────────────────────────────────── */
const NODES = [
  { x: 60, y: 40, r: 6, color: '#c9a84c', label: 'INPUT' },
  { x: 150, y: 40, r: 6, color: '#c9a84c', label: 'CONV' },
  { x: 240, y: 40, r: 6, color: '#c9a84c', label: 'BN' },
  { x: 330, y: 40, r: 6, color: '#c9a84c', label: 'RELU' },
  { x: 240, y: 110, r: 6, color: '#c9a84c', label: 'POOL' },
  { x: 330, y: 110, r: 6, color: '#ff5e1a', label: 'BLOCK' },
  { x: 430, y: 110, r: 8, color: '#ff2020', label: 'FC ⚠' },
]
const EDGES = [[0, 1], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5], [5, 6]]


export default function Tool01() {
  const [ref, inView] = useInView()
  const [activeProblem, setActiveProblem] = useState(0)
  const [activeFeature, setActiveFeature] = useState(0)
  const [hovered, setHovered] = useState(null)
  const navigate = useNavigate()
  return (
    <section ref={ref} id="tools" className="relative overflow-hidden py-24 min-h-screen">

      {/* ── Background ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--bg3)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 80% at 20% 50%, rgba(255,94,26,0.07) 0%, transparent 65%)',
      }} />

      {/* ── Left vertical label ── */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center pointer-events-none"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
        <span className="font-mono-tech"
          style={{ color: 'rgba(255,94,26,0.15)', fontSize: '0.55rem', letterSpacing: '0.25em' }}>
          TOOL_01 / TENSOR_SHAPE_DEBUGGER / NV-TSD
        </span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">

        {/* ══════════════════════════════════════════════════════
            SECTION A — TOOL HEADER
        ══════════════════════════════════════════════════════ */}
        <div className="flex flex-wrap items-start justify-between gap-8 mb-20">
          <div>
            <div className="font-mono-tech mb-3" style={{
              color: 'var(--ember)', fontSize: '0.6rem', letterSpacing: '0.3em',
              opacity: inView ? 1 : 0, transition: 'all 0.5s ease',
            }}>◆ TOOL 01 — NV-TSD</div>
            <h2 className="font-bebas leading-none" style={{
              fontSize: 'clamp(2.5rem, 6vw, 7rem)', color: 'var(--text)', letterSpacing: '0.02em',
              opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)',
              transition: 'all 0.7s ease 0.1s',
            }}>TENSOR SHAPE</h2>
            <h2 className="font-bebas leading-none" style={{
              fontSize: 'clamp(2.5rem, 6vw, 7rem)', color: 'var(--ember)',
              textShadow: '0 0 50px rgba(255,94,26,0.4)', letterSpacing: '0.02em',
              opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)',
              transition: 'all 0.7s ease 0.2s',
            }}>DEBUGGER</h2>
          </div>
          <div className="flex flex-col gap-2 pt-2" style={{ opacity: inView ? 1 : 0, transition: 'all 0.6s ease 0.3s' }}>
            <DiagLabel label="ENGINE" value="AST PARSER" color="ember" />
            <DiagLabel label="PRECISION" value="LAYER-LEVEL" color="dim" />
            <DiagLabel label="RUNTIME" value="REAL-TIME" color="ember" blink />
            {/**<button onClick={() => navigate('/tensorshapedebugger')}  className="inline-flex items-center gap-2 px-2.5 py-1 border font-mono-tech text-xs ${className}"
              style={{ borderColor: 'rgba(0,229,255,0.25)', color: 'var(--ember)', background: 'rgba(5,5,8,0.6)' }} >

              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: 'var(--ember)' }}
              />

              <span style={{ color: 'var(--text-dim)', fontSize: '0.6rem' }}>USE</span>
              <span style={{ color: 'var(--text-dim)' }}>TENSOR_SHAPE_DEBUGGER</span>
          </button>**/}
          </div>
        </div>

    
        <div className="mb-20" style={{
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(30px)',
          transition: 'all 0.8s ease 0.2s',
        }}>
          {/* Section label */}
          <div className="flex items-center gap-4 mb-8">
            <span className="font-mono-tech" style={{ color: '#ff2020', fontSize: '0.6rem', letterSpacing: '0.3em' }}>
              ◆ THE PROBLEM
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,32,32,0.15)' }} />
            <span className="font-mono-tech" style={{ color: 'rgba(255,32,32,0.3)', fontSize: '0.55rem', letterSpacing: '0.2em' }}>
              WHAT ML ENGINEERS FACE DAILY
            </span>
          </div>

          {/* Problem tabs */}
          <div className="flex gap-3 mb-5 flex-wrap">
            {PROBLEMS.map((p, i) => (
              <button key={p.id} onClick={() => setActiveProblem(i)}
                className="font-mono-tech px-4 py-2 border transition-all duration-200"
                style={{
                  fontSize: '0.6rem', letterSpacing: '0.15em',
                  borderColor: activeProblem === i ? p.color : 'rgba(255,255,255,0.08)',
                  color: activeProblem === i ? p.color : 'var(--text-dim)',
                  background: activeProblem === i ? `${p.color}11` : 'transparent',
                }}>
                {p.id} — {p.title}
              </button>
            ))}
          </div>

          {/* Active problem terminal */}
          <div className="border" style={{ borderColor: 'rgba(255,32,32,0.2)', background: 'rgba(5,5,8,0.85)' }}>
            {/* Terminal bar */}
            <div className="flex items-center gap-3 px-4 py-2 border-b" style={{ borderColor: 'rgba(255,32,32,0.12)' }}>
              {['#ff2e2e', '#ffb300', '#00e676'].map((c, i) => (
                <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              ))}
              <span className="font-mono-tech" style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>
                bash — engineer_pain.log — {PROBLEMS[activeProblem].id}
              </span>
              <div className="ml-auto">
                <span className="font-mono-tech px-2 py-0.5 border" style={{
                  fontSize: '0.55rem', color: '#ff2020', borderColor: 'rgba(255,32,32,0.3)',
                }}>⚠ ERROR</span>
              </div>
            </div>
            <pre className="font-mono-tech p-5 overflow-auto" style={{
              fontSize: '0.68rem', lineHeight: 2, whiteSpace: 'pre-wrap', color: 'var(--text-dim)',
            }}>
              {PROBLEMS[activeProblem].snippet.split('\n').map((line, i) => {
                let color = 'var(--text-dim)'
                if (line.startsWith('Traceback') || line.startsWith('RuntimeError') || line.startsWith('AssertionError')) color = '#ff2020'
                if (line.startsWith('  File') || line.startsWith('  Expected') || line.startsWith('  Got')) color = '#ff5555'
                if (line.startsWith('>>>')) color = 'rgba(201,168,76,0.7)'
                if (line.startsWith('#')) color = 'rgba(201,168,76,0.35)'
                return <div key={i} style={{ color }}>{line}</div>
              })}
            </pre>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION C — THE SOLUTION (how NV-TSD solves it)
        ══════════════════════════════════════════════════════ */}
        <div className="mb-20" style={{
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(30px)',
          transition: 'all 0.8s ease 0.4s',
        }}>
          <div className="flex items-center gap-4 mb-8">
            <span className="font-mono-tech" style={{ color: 'var(--ember)', fontSize: '0.6rem', letterSpacing: '0.3em' }}>
              ◆ THE SOLUTION
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,94,26,0.15)' }} />
            <span className="font-mono-tech" style={{ color: 'rgba(255,94,26,0.3)', fontSize: '0.55rem', letterSpacing: '0.2em' }}>
              HOW NV-TSD ELIMINATES THE PAIN
            </span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left — solution steps */}
            <div className="space-y-3">
              {SOLUTION_STEPS.map((s, i) => (
                <div key={s.step} className="flex gap-4 border p-4 group" style={{
                  borderColor: 'rgba(255,94,26,0.12)', background: 'rgba(5,5,8,0.6)',
                  transition: 'border-color 0.2s',
                }}>
                  <div className="flex-shrink-0 w-8 h-8 border flex items-center justify-center" style={{
                    borderColor: 'rgba(255,94,26,0.3)',
                    background: 'rgba(255,94,26,0.06)',
                  }}>
                    <span className="font-mono-tech" style={{ color: 'var(--ember)', fontSize: '0.6rem' }}>{s.step}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: 'var(--ember)', fontSize: '0.75rem' }}>{s.icon}</span>
                      <span className="font-mono-tech" style={{ color: 'var(--ember)', fontSize: '0.6rem', letterSpacing: '0.12em' }}>{s.label}</span>
                    </div>
                    <p className="font-body" style={{ color: 'var(--text-dim)', fontSize: '0.72rem', lineHeight: 1.65 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right — NV-TSD trace output */}
            <div className="border" style={{ borderColor: 'rgba(255,94,26,0.15)', background: 'rgba(5,5,8,0.8)' }}>
              <div className="flex items-center gap-3 px-4 py-2 border-b" style={{ borderColor: 'rgba(255,94,26,0.1)' }}>
                {['#ff2e2e', '#ffb300', '#00e676'].map((c, i) => (
                  <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                ))}
                <span className="font-mono-tech" style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>
                  neuralveil.trace — bash — 80×24
                </span>
                <div className="ml-auto">
                  <DiagLabel label="ACTIVE" value="TRACE" color="ember" blink />
                </div>
              </div>
              <pre className="font-mono-tech p-4 overflow-auto" style={{
                color: 'var(--text-dim)', fontSize: '0.63rem', lineHeight: 1.8,
                whiteSpace: 'pre-wrap', maxHeight: '340px',
              }}>
                {TRACE_OUTPUT.split('\n').map((line, i) => {
                  let color = 'var(--text-dim)'
                  if (line.startsWith('>>>')) color = 'var(--cyan)'
                  if (line.startsWith('! ERROR')) color = '#ff2020'
                  if (line.startsWith('  Shape')) color = '#ff5555'
                  if (line.startsWith('  Suggest')) color = 'var(--gold)'
                  if (line.startsWith('TRACE')) color = 'var(--gold)'
                  if (line.startsWith('Layer') && !line.includes('×')) color = 'var(--text)'
                  if (line.includes('×')) color = '#ff3333'
                  if (line.startsWith('#')) color = 'rgba(201,168,76,0.4)'
                  return <div key={i} style={{ color }}>{line}</div>
                })}
                <div className="mt-1 animate-pulse" style={{ color: 'var(--ember)' }}>█</div>
              </pre>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION D — COMPUTE GRAPH + FEATURES
        ══════════════════════════════════════════════════════ */}
        <div style={{
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(30px)',
          transition: 'all 0.8s ease 0.6s',
        }}>
          <div className="flex items-center gap-4 mb-8">
            <span className="font-mono-tech" style={{ color: 'var(--ember)', fontSize: '0.6rem', letterSpacing: '0.3em' }}>
              ◆ FEATURES
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,94,26,0.15)' }} />
            <span className="font-mono-tech" style={{ color: 'rgba(255,94,26,0.3)', fontSize: '0.55rem', letterSpacing: '0.2em' }}>
              WHAT NV-TSD CAN DO
            </span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left — compute graph + screenshot placeholder */}
            <div className="space-y-4">
              {/* Node graph */}
              <div className="border" style={{ borderColor: 'rgba(255,94,26,0.15)', background: 'rgba(5,5,8,0.7)' }}>
                <div className="flex items-center gap-3 px-3 py-2 border-b" style={{ borderColor: 'rgba(255,94,26,0.1)' }}>
                  {['#ff2e2e', '#ffb300', '#00e676'].map((c, i) => (
                    <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  ))}
                  <span className="font-mono-tech" style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>
                    nv-tracer :: compute_graph.render
                  </span>
                </div>
                <svg viewBox="0 0 500 160" className="w-full" style={{ height: '160px' }}>
                  <defs>
                    <filter id="node-glow"><feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                    <filter id="error-glow"><feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                  </defs>
                  {EDGES.map(([a, b], i) => (
                    <line key={i} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y}
                      stroke={b === 6 ? '#ff2020' : '#c9a84c'} strokeWidth={b === 6 ? '1.5' : '0.8'}
                      strokeOpacity={b === 6 ? '0.8' : '0.4'} strokeDasharray={b === 6 ? '4 3' : undefined} />
                  ))}
                  {NODES.map((n, i) => (
                    <g key={i} className="cursor-pointer"
                      onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                      <circle cx={n.x} cy={n.y} r={n.r + (hovered === i ? 3 : 0)} fill={n.color}
                        opacity={i === 6 ? 0.9 : 0.7} filter={i === 6 ? 'url(#error-glow)' : 'url(#node-glow)'}
                        style={{ transition: 'r 0.2s ease' }} />
                      <circle cx={n.x} cy={n.y} r={n.r + 4} fill="none" stroke={n.color} strokeWidth="0.5" opacity={0.2} />
                      <text x={n.x} y={n.y + 18} textAnchor="middle"
                        fontFamily="'Share Tech Mono', monospace" fontSize="7" fill={n.color} opacity="0.7">
                        {n.label}
                      </text>
                      {i === 6 && (
                        <text x={n.x} y={n.y - 16} textAnchor="middle"
                          fontFamily="'Share Tech Mono', monospace" fontSize="7" fill="#ff2020" className="animate-pulse">
                          ⚠ MISMATCH
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
              </div>

              {/* Screenshot placeholder — TOOL UI */}
              <div className="border relative overflow-hidden" style={{
                borderColor: 'rgba(255,94,26,0.15)', background: 'rgba(5,5,8,0.7)', height: '200px',
              }}>
                <div className="flex items-center gap-3 px-3 py-2 border-b" style={{ borderColor: 'rgba(255,94,26,0.1)' }}>
                  {['#ff2e2e', '#ffb300', '#00e676'].map((c, i) => (
                    <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  ))}
                  <span className="font-mono-tech" style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>
                    nv-tsd :: ui.screenshot — TOOL VIEW
                  </span>
                  <div className="ml-auto">
                    <span className="font-mono-tech px-2 py-0.5 border" style={{
                      fontSize: '0.5rem', letterSpacing: '0.1em',
                      color: 'rgba(255,94,26,0.5)', borderColor: 'rgba(255,94,26,0.2)',
                    }}>WIP</span>
                  </div>
                </div>
           
                <div className="absolute inset-0 top-9" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(255,94,26,0.03) 28px,rgba(255,94,26,0.03) 29px), repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(255,94,26,0.03) 28px,rgba(255,94,26,0.03) 29px)',
                }} />
                <div className="absolute inset-0 top-9 flex items-center justify-center">
                  <div className="text-center">
                    <div className="font-mono-tech mb-2" style={{ color: 'rgba(255,94,26,0.25)', fontSize: '2rem' }}>◈</div>
                    <div className="font-mono-tech" style={{ color: '#FFF', fontSize: '0.6rem', letterSpacing: '0.2em' }}>
                      DEVELOPMENT IN PROGRESS
                    </div>
                    <div className="font-mono-tech mt-1" style={{ color: 'rgba(255,94,26,0.15)', fontSize: '0.5rem', letterSpacing: '0.1em' }}>
                     
                    </div>
                  </div>
                </div>
              </div>

              {/* GIF placeholder */}
              <div className="border relative overflow-hidden" style={{
                borderColor: 'rgba(255,94,26,0.15)', background: 'rgba(5,5,8,0.7)', height: '180px',
              }}>
                <div className="flex items-center gap-3 px-3 py-2 border-b" style={{ borderColor: 'rgba(255,94,26,0.1)' }}>
                  {['#ff2e2e', '#ffb300', '#00e676'].map((c, i) => (
                    <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  ))}
                  <span className="font-mono-tech" style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>
                    nv-tsd :: demo.gif — LIVE TRACE
                  </span>
                  <div className="ml-auto flex gap-2 items-center">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ff5e1a' }} />
                    <span className="font-mono-tech" style={{ color: '#ff5e1a', fontSize: '0.55rem', letterSpacing: '0.1em' }}>GIF</span>
                  </div>
                </div>
                <div className="absolute inset-0 top-9" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(255,94,26,0.03) 28px,rgba(255,94,26,0.03) 29px), repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(255,94,26,0.03) 28px,rgba(255,94,26,0.03) 29px)',
                }} />
                <div className="absolute inset-0 top-9 flex items-center justify-center">
                  <div className="text-center">
                    <div className="font-mono-tech mb-2" style={{ color: 'rgba(255,94,26,0.25)', fontSize: '1.6rem' }}>▶</div>
                    <div className="font-mono-tech" style={{ color: '#fff', fontSize: '0.6rem', letterSpacing: '0.2em' }}>
                     DEVELOPMENT IN PROGESSS
                    </div>
                    <div className="font-mono-tech mt-1" style={{ color: 'rgba(255,94,26,0.15)', fontSize: '0.5rem', letterSpacing: '0.1em' }}>
                      
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — feature cards (interactive) */}
            <div>
              {/* Feature tabs */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {FEATURES.map((f, i) => (
                  <button key={f.id} onClick={() => setActiveFeature(i)}
                    className="border p-3 text-left transition-all duration-200"
                    style={{
                      borderColor: activeFeature === i ? 'rgba(255,94,26,0.5)' : 'rgba(255,94,26,0.1)',
                      background: activeFeature === i ? 'rgba(255,94,26,0.07)' : 'rgba(5,5,8,0.5)',
                    }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: activeFeature === i ? 'var(--ember)' : 'var(--text-dim)', fontSize: '0.75rem' }}>{f.icon}</span>
                      <span className="font-mono-tech" style={{
                        color: activeFeature === i ? 'var(--ember)' : 'var(--text-dim)',
                        fontSize: '0.5rem', letterSpacing: '0.08em',
                      }}>{f.label}</span>
                    </div>
                    <span className="font-mono-tech px-1.5 py-0.5 border" style={{
                      fontSize: '0.45rem', letterSpacing: '0.08em',
                      color: f.badgeColor, borderColor: `${f.badgeColor}44`,
                      background: `${f.badgeColor}11`,
                    }}>{f.badge}</span>
                  </button>
                ))}
              </div>

              {/* Active feature detail */}
              <div className="border p-5" style={{ borderColor: 'rgba(255,94,26,0.2)', background: 'rgba(5,5,8,0.7)', minHeight: '160px' }}>
                <div className="flex items-center gap-3 mb-3">
                  <span style={{ color: 'var(--ember)', fontSize: '1.2rem' }}>{FEATURES[activeFeature].icon}</span>
                  <div>
                    <div className="font-mono-tech" style={{ color: 'var(--ember)', fontSize: '0.65rem', letterSpacing: '0.12em' }}>
                      {FEATURES[activeFeature].label}
                    </div>
                    <span className="font-mono-tech px-1.5 py-0.5 border" style={{
                      fontSize: '0.45rem', letterSpacing: '0.08em',
                      color: FEATURES[activeFeature].badgeColor,
                      borderColor: `${FEATURES[activeFeature].badgeColor}44`,
                      background: `${FEATURES[activeFeature].badgeColor}11`,
                    }}>{FEATURES[activeFeature].badge}</span>
                  </div>
                </div>
                <p className="font-body mb-3" style={{ color: 'var(--text)', fontSize: '0.75rem', lineHeight: 1.7 }}>
                  {FEATURES[activeFeature].desc}
                </p>
                <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'rgba(255,94,26,0.1)' }}>
                  <span style={{ color: 'var(--ember)', fontSize: '0.55rem' }}>◆</span>
                  <span className="font-mono-tech" style={{ color: 'rgba(255,94,26,0.5)', fontSize: '0.55rem', letterSpacing: '0.1em' }}>
                    {FEATURES[activeFeature].detail}
                  </span>
                </div>
              </div>

              {/* Bottom 2×2 summary grid */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {[
                  { icon: '◈', label: 'SHAPE PROPAGATION', desc: 'Live tensor dims at every layer boundary' },
                  { icon: '◉', label: 'AST INSPECTION', desc: 'Parses model definition to extract structure' },
                  { icon: '⬡', label: 'ERROR PINPOINTING', desc: 'Exact mismatch location with fix suggestions' },
                  { icon: '◇', label: 'COMPUTE GRAPH', desc: 'Full forward-pass execution map' },
                ].map(({ icon, label, desc }) => (
                  <div key={label} className="border p-3" style={{ borderColor: 'rgba(255,94,26,0.1)', background: 'rgba(5,5,8,0.5)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: 'var(--ember)', fontSize: '0.8rem' }}>{icon}</span>
                      <span className="font-mono-tech" style={{ color: 'var(--ember)', fontSize: '0.5rem', letterSpacing: '0.08em' }}>{label}</span>
                    </div>
                    <p className="font-body" style={{ color: 'var(--text-dim)', fontSize: '0.65rem', lineHeight: 1.6 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}