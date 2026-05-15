import { useState } from 'react'
import DendriteField from '../../assets/svgs/DendriteField'
import ForgeCircuit from '../../assets/svgs/ForgeCircuit'
import { useIntersectionObserver } from '../hooks/useIntersectionObserver'
import {Link} from 'react-router'
const stats = [
  { num: '02', label: 'precision tools', sub: 'shape tracer + vram estimator' },
  { num: '∞', label: 'OOM crashes prevented', sub: 'before they ever happened' },
  { num: '01', label: 'toolkit to rule them', sub: 'browser-native, zero backend' },
]

const toolCards = [
  {
    tag: 'TOOL 01',
    name: 'SHAPE DEBUGGER',
    headline: 'Know your tensor shapes before you run a single epoch.',
    description:
      'A Python WebAssembly runtime lives entirely in your browser. Feed it a model and an input shape — it intercepts every forward-pass operation and maps the exact tensor shape flowing through every layer, including attention heads, residual branches, and dynamic batch dims.',
    highlights: [
      'Real PyTorch semantics via Pyodide WASM',
      'Catches mismatches at layer depth, not at crash time',
      'Supports dynamic shapes & optional branches',
      'Export trace as JSON / architecture diff',
    ],
    accent: 'var(--ember, #e8650a)',
    badge: 'WASM RUNTIME',
  },
  {
    tag: 'TOOL 02',
    name: 'VRAM Estimator',
    headline: 'Model your GPU memory before touching a cluster.',
    description:
      'Enter your architecture, dtype, batch config, and parallelism strategy. The estimator models per-rank activation memory, optimizer state sharding, gradient buffers, and communication overhead — across FSDP, DDP, and Tensor Parallel — and tells you whether you\'ll OOM before you submit a SLURM job.',
    highlights: [
      'FSDP sharding + activation checkpointing',
      'DDP with gradient bucket sizing',
      'Tensor Parallel rank-zero peak projections',
      'BF16 / FP16 / FP32 / INT8 awareness',
    ],
    accent: 'var(--spark, #ffb347)',
    badge: 'DISTRIBUTED AWARE',
  },
]

const timeline = [
  { phase: 'Define', code: '# define your model and let neuralveil do the rest', desc: 'Register your model and input shape' },
  { phase: 'Trace', code: 'nv.trace(model, input_shape=(32, 3, 224, 224))', desc: 'WASM intercepts every tensor op' },
  { phase: 'Inspect', code: 'nv.inspect(model, layer=11, capture_grads=True)', desc: 'Inspect shape deltas per layer' },
  { phase: 'Plan', code: 'nv.estimate_vram(model, strategy="fsdp", n_gpus=8, dtype="bf16")', desc: 'Estimate VRAM across parallel strategies' },
  { phase: 'Ship', code: 'No OOM. No roulette.', desc: 'No surprises at scale' },
]
function ToolCard({ tool, delay, hasIntersected }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered ? 'rgba(232,101,10,0.35)' : 'rgba(138,117,96,0.15)'}`,
        borderRadius: '4px',
        padding: '28px 28px 24px',
        backgroundColor: hovered ? 'rgba(232,101,10,0.04)' : 'rgba(12,9,6,0.5)',
        transition: 'all 0.3s ease',
        opacity: hasIntersected ? 1 : 0,
        transform: hasIntersected ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${delay}s`,
        transitionDuration: '0.7s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
       <div style={{
        position: 'absolute', top: 0, left: 0,
        width: '40px', height: '40px',
        borderTop: `2px solid ${tool.accent}`,
        borderLeft: `2px solid ${tool.accent}`,
        opacity: 0.6,
      }} />

    
      <div className="font-mono-jb" style={{
        display: 'inline-block', fontSize: '9px', letterSpacing: '0.14em',
        color: tool.accent, border: `1px solid ${tool.accent}`,
        padding: '2px 8px', borderRadius: '2px', marginBottom: '16px', opacity: 0.85,
      }}>
        {tool.badge}
      </div>


      <div className="font-mono-jb" style={{ fontSize: '10px', color: '#3a3028', letterSpacing: '0.1em', marginBottom: '4px' }}>
        {tool.tag}
      </div>
      <h3 className="font-bebas" style={{
        fontSize: '32px', color: '#ede8e0', letterSpacing: '0.04em',
        lineHeight: 1, marginBottom: '12px',
      }}>
        {tool.name}
      </h3>


      <p className="font-mono-jb" style={{
        fontSize: '12px', color: tool.accent, lineHeight: 1.5,
        marginBottom: '14px', fontStyle: 'italic',
      }}>
        {tool.headline}
      </p>

   
      <p className="font-mono-jb" style={{
        fontSize: '13px', color: '#7a6a58', lineHeight: '1.75', marginBottom: '20px',
      }}>
        {tool.description}
      </p>

   
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {tool.highlights.map((h, i) => (
          <li key={i} className="font-mono-jb" style={{
            fontSize: '12px', color: '#9a8878', lineHeight: 1.5,
            paddingLeft: '16px', position: 'relative', marginBottom: '4px',
          }}>
            <span style={{
              position: 'absolute', left: 0, top: '6px',
              width: '5px', height: '5px', borderRadius: '50%',
              backgroundColor: tool.accent, opacity: 0.7,
            }} />
            {h}
          </li>
        ))}
      </ul>
    </div>
  )
}

const NN_LAYERS = [
  { x: 60,  nodes: 4 },
  { x: 185, nodes: 5 },
  { x: 310, nodes: 5 },
  { x: 435, nodes: 4 },
  { x: 540, nodes: 3 },
]
const SVG_H = 320
const NODE_R = 7

function nodeY(total, idx) {
  const spacing = SVG_H / (total + 1)
  return spacing * (idx + 1)
}


const EDGES = []
for (let li = 0; li < NN_LAYERS.length - 1; li++) {
  const a = NN_LAYERS[li], b = NN_LAYERS[li + 1]
  for (let ai = 0; ai < a.nodes; ai++) {
    for (let bi = 0; bi < b.nodes; bi++) {
      EDGES.push({
        x1: a.x, y1: nodeY(a.nodes, ai),
        x2: b.x, y2: nodeY(b.nodes, bi),
        
        active: (ai + bi + li) % 4 === 0,
        bright: (ai * 3 + bi + li) % 7 === 0,
      })
    }
  }
}

function NeuralNetworkSVG() {
  return (
    <svg
      viewBox={`0 0 580 ${SVG_H}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', minHeight: '380px' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
       
        <filter id="ember-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

       
        <linearGradient id="pulse-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e8650a" stopOpacity="0">
            <animate attributeName="offset" values="0;1;1" dur="2.4s" repeatCount="indefinite" />
          </stop>
          <stop offset="0%" stopColor="#ffb347" stopOpacity="1">
            <animate attributeName="offset" values="0;0.5;1" dur="2.4s" repeatCount="indefinite" />
          </stop>
          <stop offset="10%" stopColor="#e8650a" stopOpacity="0">
            <animate attributeName="offset" values="0.1;0.6;1.1" dur="2.4s" repeatCount="indefinite" />
          </stop>
        </linearGradient>

        <linearGradient id="pulse-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e8650a" stopOpacity="0">
            <animate attributeName="offset" values="0;1;1" dur="3.1s" begin="-1.2s" repeatCount="indefinite" />
          </stop>
          <stop offset="0%" stopColor="#ff8c42" stopOpacity="1">
            <animate attributeName="offset" values="0;0.5;1" dur="3.1s" begin="-1.2s" repeatCount="indefinite" />
          </stop>
          <stop offset="10%" stopColor="#e8650a" stopOpacity="0">
            <animate attributeName="offset" values="0.1;0.6;1.1" dur="3.1s" begin="-1.2s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>


      {EDGES.map((e, i) => (
        <line
          key={`e-${i}`}
          x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
          stroke={e.bright ? 'rgba(232,101,10,0.22)' : e.active ? 'rgba(232,101,10,0.1)' : 'rgba(138,117,96,0.07)'}
          strokeWidth={e.bright ? 1.2 : 0.6}
        />
      ))}

    
      {EDGES.filter(e => e.bright).map((e, i) => (
        <line
          key={`ep-${i}`}
          x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
          stroke={i % 2 === 0 ? 'url(#pulse-grad)' : 'url(#pulse-grad-2)'}
          strokeWidth="1.5"
          opacity="0.9"
        />
      ))}

      
      {[
        { x: 60,  label: 'INPUT' },
        { x: 185, label: 'H  1' },
        { x: 310, label: 'H  2' },
        { x: 435, label: 'H  3' },
        { x: 540, label: 'OUTPUT' },
      ].map((l, i) => (
        <text
          key={`lbl-${i}`}
          x={l.x} y={SVG_H - 4}
          textAnchor="middle"
          fill="rgba(90,80,70,0.5)"
          fontSize="8"
          fontFamily="JetBrains Mono, monospace"
          letterSpacing="1.5"
        >
          {l.label}
        </text>
      ))}

   
      {NN_LAYERS.map((layer, li) =>
        Array.from({ length: layer.nodes }, (_, ni) => {
          const cx = layer.x
          const cy = nodeY(layer.nodes, ni)
          const isInput = li === 0
          const isOutput = li === NN_LAYERS.length - 1
          const isActive = (li + ni) % 3 === 0
          const isBright = (li * 2 + ni) % 5 === 0

          return (
            <g key={`n-${li}-${ni}`}>
          
              {isBright && (
                <circle
                  cx={cx} cy={cy} r={NODE_R + 5}
                  fill="none"
                  stroke="rgba(232,101,10,0.15)"
                  strokeWidth="1"
                  filter="url(#ember-glow)"
                >
                  <animate
                    attributeName="r"
                    values={`${NODE_R + 4};${NODE_R + 9};${NODE_R + 4}`}
                    dur={`${2.2 + li * 0.3}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.6;0.15;0.6"
                    dur={`${2.2 + li * 0.3}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              )}

           
              <circle
                cx={cx} cy={cy} r={NODE_R}
                fill={
                  isOutput ? '#e8650a' :
                  isInput  ? 'rgba(232,101,10,0.25)' :
                  isBright ? '#3a2010' :
                  isActive ? 'rgba(232,101,10,0.12)' :
                  'rgba(20,14,8,0.8)'
                }
                stroke={
                  isOutput ? '#ffb347' :
                  isBright ? '#e8650a' :
                  isActive ? 'rgba(232,101,10,0.45)' :
                  'rgba(138,117,96,0.25)'
                }
                strokeWidth={isBright || isOutput ? 1.5 : 0.8}
                filter={isBright || isOutput ? 'url(#node-glow)' : undefined}
              />


              {isBright && (
                <circle cx={cx} cy={cy} r={3} fill="#ffb347" opacity="0.9">
                  <animate
                    attributeName="opacity"
                    values="0.9;0.2;0.9"
                    dur={`${1.6 + ni * 0.4}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          )
        })
      )}

   
      {[
        { x: 122, y: 28,  text: 'weight: 0.847', opacity: 0.5 },
        { x: 248, y: 55,  text: 'relu(x)', opacity: 0.45 },
        { x: 370, y: 80,  text: 'dropout: 0.1', opacity: 0.4 },
        { x: 248, y: SVG_H - 52, text: 'norm: 1.02', opacity: 0.45 },
      ].map((a, i) => (
        <text
          key={`ann-${i}`}
          x={a.x} y={a.y}
          fill={`rgba(232,101,10,${a.opacity})`}
          fontSize="8.5"
          fontFamily="JetBrains Mono, monospace"
          letterSpacing="0.5"
        >
          {a.text}
        </text>
      ))}
    </svg>
  )
}


export default function About() {
  const { ref, hasIntersected } = useIntersectionObserver({ threshold: 0.1 })
  const { ref: timelineRef, hasIntersected: timelineVisible } = useIntersectionObserver({ threshold: 0.15 })

  return (
    <section
      ref={ref}
      style={{
        position: 'relative', overflow: 'hidden',
        padding: '120px 0 140px',
        backgroundColor: 'var(--forge-deep, #0d0a07)',
      }}
    >

      <div style={{ position: 'absolute', left: '-120px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <DendriteField opacity={0.06} width={720} height={900} />
      </div>
      <div style={{ position: 'absolute', right: '-180px', top: '-60px', transform: 'rotate(15deg) scaleX(-1)', pointerEvents: 'none' }}>
        <DendriteField opacity={0.035} width={600} height={600} />
      </div>
      <div style={{ position: 'absolute', left: '-60px', bottom: '-80px', pointerEvents: 'none', transform: 'rotate(-8deg)' }}>
        <ForgeCircuit opacity={0.03} width={580} height={580} animate={false} />
      </div>

    
      <div style={{
        position: 'absolute', left: '8vw', top: 0, bottom: 0, width: '1px',
        background: 'linear-gradient(to bottom, transparent, rgba(232,101,10,0.35) 30%, rgba(232,101,10,0.35) 70%, transparent)',
      }} />


      <div style={{
        position: 'absolute', top: '0', left: '8vw', right: '8vw',
        height: '1px', background: 'linear-gradient(to right, rgba(232,101,10,0.3), transparent)',
      }} />

      <div style={{ position: 'relative', zIndex: 2, paddingLeft: '12vw', paddingRight: '8vw' }}>

        
        <div style={{
          display: 'flex', alignItems: 'stretch', gap: '0',
          marginBottom: '72px',
        }}>

       
          <div style={{ flex: '0 0 480px', maxWidth: '480px', marginRight: '48px' }}>
          <p className="font-mono-jb" style={{
            fontSize: '11px', color: 'var(--ash, #8a7560)', letterSpacing: '0.14em',
            marginBottom: '18px',
            opacity: hasIntersected ? 1 : 0,
            transform: hasIntersected ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.6s ease 0.1s',
          }}>
            // what is neuralveil
          </p>
          <h2 className="font-bebas" style={{
            fontSize: 'clamp(42px, 5vw, 72px)', lineHeight: '0.93',
            letterSpacing: '0.02em', color: '#ede8e0', marginBottom: '24px',
            opacity: hasIntersected ? 1 : 0,
            transform: hasIntersected ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s ease 0.2s',
          }}>
            BUILT FOR ENGINEERS<br />
            <span style={{
              background: 'linear-gradient(90deg, var(--flame,#e8650a), var(--spark,#ffb347))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              WHO DEMAND CLARITY.
            </span>
          </h2>

          <div className="font-mono-jb" style={{
            fontSize: '14px', lineHeight: '1.85', color: '#7a6a58',
            opacity: hasIntersected ? 1 : 0,
            transform: hasIntersected ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s ease 0.35s',
          }}>
            <p style={{ marginBottom: '14px' }}>
              Neuralveil gives ML engineers{' '}
              <span style={{ color: '#b8a890' }}>surgical visibility</span> into their models before training begins —
              entirely in the browser, with no backend, no infra setup, and no compromise on depth.
            </p>
            <p style={{ marginBottom: '14px' }}>
              Two tools. Both V3. Both doing things that have never existed in a browser before: a Python
              WebAssembly runtime that intercepts real PyTorch forward-pass shapes, and a VRAM estimator
              that models distributed training memory across{' '}
              <span style={{ color: '#b8a890' }}>FSDP, DDP, and Tensor Parallel</span> strategies.
            </p>
            <p>
              No guessing. No OOM surprises. No shape roulette.{' '}
              <span style={{ color: 'var(--ember,#e8650a)' }}>Just signal.</span>
            </p>
          </div>
          </div>

        
          <div style={{
            flex: '1',
            minHeight: '420px',
            opacity: hasIntersected ? 1 : 0,
            transform: hasIntersected ? 'translateX(0)' : 'translateX(40px)',
            transition: 'all 0.9s ease 0.5s',
            position: 'relative',
            display: 'flex',
            alignItems: 'stretch',
          }}>
       
            <div style={{
              position: 'absolute', left: 0, top: '5%', bottom: '5%',
              width: '1px',
              background: 'linear-gradient(to bottom, transparent, rgba(232,101,10,0.2) 30%, rgba(232,101,10,0.2) 70%, transparent)',
            }} />
            <div style={{ flex: 1, paddingLeft: '40px' }}>
              <NeuralNetworkSVG />
            </div>
          </div>

        </div>

     
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px', marginBottom: '88px',
        }}>
          {toolCards.map((tool, i) => (
            <ToolCard key={i} tool={tool} delay={0.3 + i * 0.15} hasIntersected={hasIntersected} />
          ))}
        </div>

   
        <div ref={timelineRef} style={{
          marginBottom: '80px',
          opacity: timelineVisible ? 1 : 0,
          transform: timelineVisible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.7s ease 0.2s',
        }}>
          <p className="font-mono-jb" style={{
            fontSize: '10px', color: 'var(--ash,#8a7560)', letterSpacing: '0.14em', marginBottom: '24px',
          }}>
            // typical workflow <span>()</span>
          </p>

          <div style={{
            display: 'flex', alignItems: 'stretch', flexWrap: 'wrap', gap: '0',
            border: '1px solid rgba(138,117,96,0.12)', borderRadius: '4px', overflow: 'hidden',
          }}>
            {timeline.map((step, i) => (
              <div key={i} style={{
                flex: '1', minWidth: '160px',
                borderRight: i < timeline.length - 1 ? '1px solid rgba(138,117,96,0.12)' : 'none',
                padding: '20px 18px',
                position: 'relative',
                backgroundColor: i === 4 ? 'rgba(232,101,10,0.06)' : 'rgba(12,9,6,0.4)',
              }}>
            
                <div className="font-bebas" style={{
                  fontSize: '11px', color: i === 4 ? 'var(--ember,#e8650a)' : '#3a3028',
                  letterSpacing: '0.12em', marginBottom: '8px',
                }}>
                  {i < 4 ? `STEP 0${i + 1}` : '✓ DONE'}
                </div>
             
                <div className="font-bebas" style={{
                  fontSize: '22px', color: i === 4 ? 'var(--ember,#e8650a)' : '#ede8e0',
                  letterSpacing: '0.06em', lineHeight: 1, marginBottom: '10px',
                }}>
                  {step.phase}
                </div>
              
                <div className="font-mono-jb" style={{
                  fontSize: '10px', color: i === 4 ? 'var(--ember,#e8650a)' : '#5a6470',
                  backgroundColor: 'rgba(0,0,0,0.3)', padding: '6px 8px',
                  borderRadius: '2px', marginBottom: '8px',
                  wordBreak: 'break-all',
                }}>
                  {step.code}
                </div>
            
                <div className="font-mono-jb" style={{
                  fontSize: '11px', color: '#4a4038', lineHeight: 1.5,
                }}>
                  {step.desc}
                </div>

                {i < timeline.length - 1 && (
                  <div style={{
                    position: 'absolute', right: '-7px', top: '50%', transform: 'translateY(-50%)',
                    width: '12px', height: '12px',
                    borderTop: '1px solid rgba(232,101,10,0.4)',
                    borderRight: '1px solid rgba(232,101,10,0.4)',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 2, backgroundColor: 'var(--forge-deep,#0d0a07)',
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>

    
        <div style={{
          display: 'flex', gap: '0', flexWrap: 'wrap',
          borderTop: '1px solid rgba(138,117,96,0.12)',
          paddingTop: '36px',
          opacity: hasIntersected ? 1 : 0,
          transform: hasIntersected ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.7s ease 0.55s',
        }}>
          {stats.map((stat, i) => (
            <div key={i} className='sm:block hidden' style={{
              flex: '1', minWidth: '160px', paddingRight: '28px',
              borderRight: i < stats.length - 1 ? '1px solid rgba(138,117,96,0.12)' : 'none',
              paddingLeft: i > 0 ? '28px' : '0',
            }}>
              <div className="font-bebas" style={{
                fontSize: '42px', color: 'var(--ember,#e8650a)', lineHeight: 1,
                marginBottom: '2px', letterSpacing: '0.04em',
              }}>
                {stat.num}
              </div>
              <div className="font-mono-jb" style={{ fontSize: '12px', color: '#b8a890', letterSpacing: '0.06em', marginBottom: '2px' }}>
                {stat.label}
              </div>
              <div className="font-mono-jb" style={{ fontSize: '10px', color: '#4a4038', letterSpacing: '0.04em' }}>
                {stat.sub}
              </div>
            </div>
          ))}

       
          <div style={{
            flex: '1', minWidth: '160px', paddingLeft: '28px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px',
          }}>
            <a href='#launch' >
            <button className="font-mono-jb" style={{
              backgroundColor: 'var(--ember,#e8650a)', color: 'var(--void,#0a0705)',
              border: 'none', padding: '12px 22px', fontSize: '11px',
              letterSpacing: '0.1em', fontWeight: '700', cursor: 'pointer',
              borderRadius: '2px', transition: 'all 0.2s ease', textAlign: 'left',
            }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--flame,#ff6b1a)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--ember,#e8650a)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              TRY SHAPE TRACER →
            </button>
            </a>
            <a href="#launch">
            <button className="font-mono-jb" style={{
              backgroundColor: 'transparent', color: 'var(--ember,#e8650a)',
              border: '1px solid rgba(232,101,10,0.35)', padding: '12px 22px',
              fontSize: '11px', letterSpacing: '0.1em', fontWeight: '500',
              cursor: 'pointer', borderRadius: '2px', transition: 'all 0.2s ease', textAlign: 'left', width: '100%'
            }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(232,101,10,0.07)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              ESTIMATE VRAM →
            </button>
            </a>
          </div>
        </div>

      </div>
    </section>
  )
}