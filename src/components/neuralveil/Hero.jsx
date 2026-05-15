import { useState, useEffect, useRef } from 'react'
import NeuralGraph from '../../assets/svgs/NeuralGraph'

const heroTypewriterLines = [
  'neuralveil.trace(model, input_shape=(32, 3, 224, 224))',
  'vram_estimator.plan(strategy="fsdp", n_gpus=8, dtype="bf16")',
  'forge.inspect(layer="transformer.blocks[11].attn", grad=True)',
  'neuralveil.diff(model_v1, model_v2, depth="param_level")',
  'vram_estimator.simulate(batch_size=512, seq_len=2048)',
]

const floatingMetrics = [
  { label: 'Peak VRAM', value: '38.4 GB', delta: 'ckpt saves 12.1 GB', positive: true },
  { label: 'Shape Mismatch', value: 'Layer 7', delta: 'caught', positive: true },
  { label: 'Grad Norm', value: '0.0031', delta: '↓ stable', positive: true },
  { label: 'OOM Risk', value: 'None', delta: 'FSDP safe', positive: true },
]

const floatingMetricsLeft = [
  { label: 'Tensor Ranks', value: '4D→2D', delta: 'projection safe', positive: true },
  { label: 'Attn Heads', value: '16 × 64', delta: 'shape verified', positive: true },
  { label: 'Param Count', value: '124M', delta: 'bf16 mapped', positive: true },
  { label: 'Activation Mem', value: '6.2 GB', delta: 'ckpt eligible', positive: true },
]

const codeLines = [
  { text: 'import neuralveil as nv', color: '#c8bfb0' },
  { text: '', color: '' },
  { text: '# Surgical forward-pass tracing', color: '#5a6470' },
  { text: 'trace = nv.trace(', color: '#c8bfb0' },
  { text: '    model=ResNet50(),', color: '#b8a890' },
  { text: '    input_shape=(32, 3, 224, 224),', color: '#b8a890' },
  { text: '    dtype=torch.bfloat16', color: '#b8a890' },
  { text: ')', color: '#c8bfb0' },
  { text: '', color: '' },
  { text: '# Zero OOM surprises', color: '#5a6470' },
  { text: 'trace.estimate_vram(strategy="fsdp")', color: '#E8650A' },
]

function useTypewriter(lines) {
  const [display, setDisplay] = useState('')
  const [lineIdx, setLineIdx] = useState(0)
  const [phase, setPhase] = useState('typing')

  useEffect(() => {
    const line = lines[lineIdx]
    let timeout
    if (phase === 'typing') {
      if (display.length < line.length) {
        timeout = setTimeout(() => setDisplay(line.slice(0, display.length + 1)), 36 + Math.random() * 28)
      } else {
        timeout = setTimeout(() => setPhase('holding'), 2200)
      }
    } else if (phase === 'holding') {
      setPhase('wiping')
    } else if (phase === 'wiping') {
      if (display.length > 0) {
        timeout = setTimeout(() => setDisplay(display.slice(0, -1)), 16)
      } else {
        setLineIdx((i) => (i + 1) % lines.length)
        setPhase('typing')
      }
    }
    return () => clearTimeout(timeout)
  }, [display, phase, lineIdx, lines])

  return display
}

function FloatingCard({ metric, style, dim = false }) {
  return (
    <div style={{
      position: 'absolute',
      backgroundColor: dim ? 'rgba(10, 7, 4, 0.7)' : 'rgba(12, 9, 6, 0.85)',
      border: `1px solid ${dim ? 'rgba(138, 117, 96, 0.15)' : 'rgba(232, 101, 10, 0.25)'}`,
      borderRadius: '6px',
      padding: '12px 16px',
      backdropFilter: 'blur(12px)',
      minWidth: '140px',
      ...style,
    }}>
      <div style={{ fontSize: '10px', color: dim ? '#3a3830' : '#5a6470', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>
        {metric.label.toUpperCase()}
      </div>
      <div style={{ fontSize: '18px', color: dim ? '#7a6e62' : '#ede8e0', fontWeight: '700', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.04em', lineHeight: 1.1 }}>
        {metric.value}
      </div>
      <div style={{ fontSize: '10px', color: dim ? '#3a4038' : (metric.positive ? '#4caf80' : '#e65a5a'), fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
        {metric.delta}
      </div>
    </div>
  )
}

export default function Hero() {
  const typed = useTypewriter(heroTypewriterLines)
  const [visibleLines, setVisibleLines] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    let i = 0
    const interval = setInterval(() => {
      i++
      setVisibleLines(i)
      if (i >= codeLines.length) clearInterval(interval)
    }, 140)
    return () => clearInterval(interval)
  }, [])

  return (
    <section
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        paddingTop: '64px',
        background: `radial-gradient(ellipse at 65% 45%, rgba(232, 101, 10, 0.04) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(232, 101, 10, 0.03) 0%, transparent 50%), var(--void, #0a0705)`,
      }}
    >
   
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
        opacity: 0.3,
      }} />


      <div style={{
        position: 'absolute', right: '-60px', top: '50%',
        transform: 'translateY(-50%)', pointerEvents: 'none',
      }}>
        <NeuralGraph opacity={0.1} width={860} height={700} animate={true} />
      </div>

   
      <FloatingCard dim metric={floatingMetricsLeft[0]} style={{ right: '22vw', top: '18%', opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease 1.2s' }} />
      <FloatingCard dim metric={floatingMetricsLeft[1]} style={{ right: '18vw', top: '32%', opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease 1.45s' }} />
      <FloatingCard dim metric={floatingMetricsLeft[2]} style={{ right: '23vw', top: '48%', opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease 1.65s' }} />
      <FloatingCard dim metric={floatingMetricsLeft[3]} style={{ right: '17vw', top: '62%', opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease 1.85s' }} />


      <div style={{
        position: 'absolute',
        right: '15.5vw',
        top: '16%',
        bottom: '22%',
        width: '1px',
        background: 'linear-gradient(to bottom, transparent, rgba(138,117,96,0.2) 20%, rgba(138,117,96,0.2) 80%, transparent)',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.6s ease 2s',
        pointerEvents: 'none',
      }} />
      {[18, 32, 48, 62].map((top, i) => (
        <div key={i} style={{
          position: 'absolute',
          right: '15.5vw',
          top: `calc(${top}% + 22px)`,
          width: '8px',
          height: '1px',
          backgroundColor: 'rgba(232,101,10,0.3)',
          opacity: mounted ? 1 : 0,
          transition: `opacity 0.4s ease ${2.1 + i * 0.1}s`,
          pointerEvents: 'none',
        }} />
      ))}

   
      <FloatingCard metric={floatingMetrics[0]} style={{ right: '4vw', top: '18%', opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease 1.4s' }} />
      <FloatingCard metric={floatingMetrics[1]} style={{ right: '2vw', top: '32%', opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease 1.7s' }} />
      <FloatingCard metric={floatingMetrics[2]} style={{ right: '5vw', top: '48%', opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease 2.0s' }} />
      <FloatingCard metric={floatingMetrics[3]} style={{ right: '2vw', top: '62%', opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease 2.2s' }} />

 
      <div style={{
        position: 'absolute', left: 0, top: '15%', bottom: '15%',
        width: '2px',
        background: 'linear-gradient(to bottom, transparent, rgba(232,101,10,0.5) 30%, rgba(232,101,10,0.5) 70%, transparent)',
      }} />

   
      <div style={{
        position: 'absolute', top: '64px', left: '8vw', right: '8vw',
        height: '1px', background: 'linear-gradient(to right, rgba(232,101,10,0.3), transparent)',
      }} />


      <div style={{
        position: 'relative', zIndex: 2,
        paddingLeft: '10vw', paddingRight: '48px', maxWidth: '820px',
      }}>
    
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '28px',
          opacity: 0, animation: 'fade-up 0.6s ease 0.2s forwards',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4caf80', boxShadow: '0 0 8px #4caf80' }} />
         
           </div>

      
        <h1 className="font-bebas" style={{
          fontSize: 'clamp(64px, 8.5vw, 112px)',
          lineHeight: '0.91', letterSpacing: '0.02em',
          margin: '0 0 28px 0',
          opacity: 0, animation: 'fade-up 0.7s ease 0.4s forwards',
        }}>
          <span style={{ color: '#ede8e0', display: 'block' }}>THE FORGE WHERE</span>
          <span style={{ display: 'block' }}>
            <span style={{
              background: 'linear-gradient(90deg, var(--hot, #ff8c42) 0%, var(--flame, #e8650a) 40%, #ffe0c0 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>MODELS ARE</span>
          </span>
          <span style={{
            background: 'linear-gradient(90deg, var(--ember, #e8650a) 0%, var(--spark, #ffb347) 60%, #fff5e0 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'block',
          }}>UNDERSTOOD</span>
        </h1>

        <p className="font-mono-jb" style={{
          fontSize: '14px', lineHeight: '1.7', color: '#7a6a58', maxWidth: '520px',
          marginBottom: '36px',
          opacity: 0, animation: 'fade-up 0.6s ease 0.6s forwards',
        }}>
          Most shape errors surface at crash time. Most OOM errors surface on a cluster you're paying for.{' '}
          <span style={{ color: '#b8a890' }}>NeuralVeil moves both to design time — a Pyodide WebAssembly runtime that intercepts real forward-pass shapes, 
           , and a memory estimator that models per-rank activation, gradient, and optimizer state across FSDP, DDP, and Tensor Parallel.</span>{' '}
          No OOM surprises. No shape roulette. No guessing.
 No setup. No backend. No surprises.
        </p>

    
        <div style={{ marginBottom: '20px', opacity: 0, animation: 'fade-up 0.7s ease 0.75s forwards' }}>
          <div className="font-mono-jb" style={{
            fontSize: '13px', color: 'var(--ash, #8a7560)',
            backgroundColor: 'rgba(8, 6, 4, 0.9)',
            border: '1px solid rgba(138, 117, 96, 0.18)',
            borderRadius: '4px',
            overflow: 'hidden',
            maxWidth: '560px',
          }}>
          
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderBottom: '1px solid rgba(138,117,96,0.12)',
              backgroundColor: 'rgba(15,11,7,0.6)',
            }}>
              {['#e85d5d','#e8a020','#4caf80'].map((c, i) => (
                <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: c, opacity: 0.7 }} />
              ))}
              <span style={{ marginLeft: '8px', fontSize: '10px', color: '#3a3028', letterSpacing: '0.08em' }}>neuralveil — bash</span>
            </div>
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '4px', minHeight: '48px' }}>
              <span style={{ color: 'var(--ember, #e8650a)', marginRight: '8px' }}>❯</span>
              <span style={{ color: '#c8bfb0' }}>{typed}</span>
              <span className="animate-blink" style={{
                display: 'inline-block', width: '2px', height: '14px',
                backgroundColor: 'var(--ember, #e8650a)', marginLeft: '1px',
              }} />
            </div>
          </div>
        </div>


      
        <div style={{
          display: 'flex', gap: '14px', flexWrap: 'wrap',
          opacity: 0, animation: 'fade-up 0.7s ease 1.1s forwards',
        }}>
          <button
            className="font-mono-jb animate-cta-pulse"
            style={{
              backgroundColor: 'var(--ember, #e8650a)', color: 'var(--void, #0a0705)',
              border: 'none', padding: '14px 32px', fontSize: '12px',
              letterSpacing: '0.1em', fontWeight: '700', cursor: 'pointer',
              borderRadius: '2px', transition: 'background-color 0.2s ease, transform 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--flame,#ff6b1a)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--ember,#e8650a)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            ENTER THE FORGE
          </button>
          <button
            className="font-mono-jb"
            style={{
              backgroundColor: 'transparent', color: 'var(--ember,#e8650a)',
              border: '1px solid rgba(232,101,10,0.45)', padding: '14px 32px',
              fontSize: '12px', letterSpacing: '0.1em', fontWeight: '500',
              cursor: 'pointer', borderRadius: '2px', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(232,101,10,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            VIEW ON GITHUB
          </button>
          <button
            className="font-mono-jb"
            style={{
              backgroundColor: 'transparent', color: '#5a6470',
              border: '1px solid rgba(90,100,112,0.3)', padding: '14px 28px',
              fontSize: '12px', letterSpacing: '0.1em', fontWeight: '400',
              cursor: 'pointer', borderRadius: '2px', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#8a9098'; e.currentTarget.style.borderColor = 'rgba(138,144,152,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#5a6470'; e.currentTarget.style.borderColor = 'rgba(90,100,112,0.3)' }}
          >
            READ THE DOCS ↗
          </button>
        </div>

      
        
      </div>

 
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '140px',
        background: 'linear-gradient(to bottom, transparent, var(--void,#0a0705))',
        pointerEvents: 'none',
      }} />
    </section>
  )
}