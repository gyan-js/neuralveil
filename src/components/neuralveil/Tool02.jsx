import React, { useState } from 'react'
import { useInView } from '../hooks/useInView.js'
import DiagLabel from './DiagLabel.jsx'

/* ─── MEMORY BREAKDOWN DATA ───────────────────────────────────── */
const MEMORY_BREAKDOWN = [
  { label: 'Weights / Parameters',   gb: 14.2, pct: 52, color: '#00e5ff' },
  { label: 'Activations (fwd pass)', gb: 6.8,  pct: 25, color: '#00bcd4' },
  { label: 'Optimizer States',       gb: 4.1,  pct: 15, color: '#0097a7' },
  { label: 'Gradient Buffers',       gb: 2.1,  pct: 8,  color: '#006064' },
]

const MODELS = [
  { name: 'GPT-2 Small',  params: '117M',  vram: '1.6 GB',  util: 20  },
  { name: 'LLaMA-7B',     params: '7B',    vram: '14.2 GB', util: 89  },
  { name: 'Mistral-7B',   params: '7.2B',  vram: '14.5 GB', util: 91  },
  { name: 'GPT-4 (?)',    params: '~1.8T', vram: '~3.2 TB', util: 100 },
]

/* ─── PROBLEM SNIPPETS ────────────────────────────────────────── */
const GPU_PROBLEMS = [
  {
    id: 'P-01',
    title: 'OOM Mid-Training',
    snippet: `# 3 hours into training. Epoch 12/50.
torch.cuda.OutOfMemoryError: CUDA out of memory.
  Tried to allocate 2.50 GiB
  (GPU 0; 79.20 GiB total capacity;
   73.41 GiB already allocated;
   4.12 GiB free; 74.95 GiB reserved)

>>> # You had no estimate before starting.
>>> # Now you've wasted 3 hours of A100 time.
>>> # $$$`,
    color: '#ff2020',
  },
  {
    id: 'P-02',
    title: 'Underprovisioning',
    snippet: `# You rented a 40GB A100. Model needs 42GB.
# You discover this 20 minutes into the job.

RuntimeError: CUDA error: device-side assert triggered
  Expected model to fit in 40 GB, used 42.3 GB

>>> # You guessed. You were wrong.
>>> # No tool told you before you paid.`,
    color: '#ff5e1a',
  },
  {
    id: 'P-03',
    title: 'Optimizer State Blindness',
    snippet: `# Model weights: 7B * 2 bytes (fp16) = 14 GB
# "Should fit on A100-80G easily."

# 40 minutes in: OOM at batch_size=16.
# You forgot: Adam stores 2 moments per param.
#   optimizer_states = 14 GB * 2 = 28 GB
#   activations      = ~7 GB
#   gradients        = ~14 GB
#   total            = 63 GB  ← A100 LIMIT

>>> # No one told you to account for this.`,
    color: '#ffb300',
  },
]

/* ─── FEATURES ────────────────────────────────────────────────── */
const GME_FEATURES = [
  {
    id: 'F-01',
    icon: '◈',
    label: 'PRECISION MODE',
    badge: 'DTYPE AWARE',
    badgeColor: '#00e5ff',
    desc: 'float16, bfloat16, int8, int4 — NeuralVeil models exact dtype memory savings. See the real footprint before you commit to a dtype.',
    detail: 'FP32 vs FP16 breakdown included.',
  },
  {
    id: 'F-02',
    icon: '⬡',
    label: 'HARDWARE PROFILES',
    badge: 'MULTI-GPU',
    badgeColor: '#00bcd4',
    desc: 'A100-80G, H100, RTX 4090, V100, M2 Ultra — memory estimates per hardware target. Know if your model fits before renting.',
    detail: 'Includes memory bandwidth analysis.',
  },
  {
    id: 'F-03',
    icon: '◉',
    label: 'BATCH SIZE SWEEP',
    badge: 'V2 FEATURE',
    badgeColor: '#0097a7',
    desc: 'See VRAM growth across batch sizes 1→512 before you crash training runs. Find your safe maximum batch automatically.',
    detail: 'Activation memory scales linearly.',
  },
  {
    id: 'F-04',
    icon: '◇',
    label: 'GRADIENT CHECKPOINTING',
    badge: 'TRADE-OFF SIM',
    badgeColor: '#ff5e1a',
    desc: 'Simulate checkpoint savings vs compute overhead. Understand the exact memory-vs-speed trade-off for your specific model architecture.',
    detail: 'Also models mixed precision per layer.',
  },
]

export default function Tool02() {
  const [ref, inView]        = useInView()
  const [selected, setSelected]     = useState(1)
  const [activeProblem, setActiveProblem] = useState(0)
  const [activeFeature, setActiveFeature] = useState(0)

  return (
    <section ref={ref} className="relative overflow-hidden py-24 min-h-screen">

      {/* ── Background ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--bg2)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 80% at 80% 50%, rgba(0,229,255,0.05) 0%, transparent 65%)',
      }} />

      {/* ── Right vertical label ── */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center pointer-events-none"
        style={{ writingMode: 'vertical-rl' }}>
        <span className="font-mono-tech"
          style={{ color: 'rgba(0,229,255,0.12)', fontSize: '0.55rem', letterSpacing: '0.25em' }}>
          TOOL_02 / GPU_MEMORY_ESTIMATOR / NV-GME
        </span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">

        {/* ══════════════════════════════════════════════════════
            SECTION A — TOOL HEADER
        ══════════════════════════════════════════════════════ */}
        <div className="flex flex-wrap items-start justify-between gap-8 mb-20">
          <div>
            <div className="font-mono-tech mb-3" style={{
              color: 'var(--cyan)', fontSize: '0.6rem', letterSpacing: '0.3em',
              opacity: inView ? 1 : 0, transition: 'all 0.5s ease',
            }}>◆ TOOL 02 — NV-GME</div>
            <h2 className="font-bebas leading-none" style={{
              fontSize: 'clamp(2.5rem, 6vw, 7rem)', color: 'var(--text)', letterSpacing: '0.02em',
              opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)',
              transition: 'all 0.7s ease 0.1s',
            }}>GPU MEMORY</h2>
            <h2 className="font-bebas leading-none" style={{
              fontSize: 'clamp(2.5rem, 6vw, 7rem)', color: 'var(--cyan)',
              textShadow: '0 0 50px rgba(0,229,255,0.3)', letterSpacing: '0.02em',
              opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)',
              transition: 'all 0.7s ease 0.2s',
            }}>ESTIMATOR</h2>
          </div>
          <div className="flex flex-col gap-2 pt-2" style={{ opacity: inView ? 1 : 0, transition: 'all 0.6s ease 0.3s' }}>
            <DiagLabel label="PRECISION" value="±0.1 GB"     color="cyan" />
            <DiagLabel label="MODE"      value="ANALYTICAL"  color="dim" />
            <DiagLabel label="TARGET"    value="GPU / VRAM"  color="cyan" blink />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION B — THE PROBLEM
        ══════════════════════════════════════════════════════ */}
        <div className="mb-20" style={{
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(30px)',
          transition: 'all 0.8s ease 0.2s',
        }}>
          <div className="flex items-center gap-4 mb-8">
            <span className="font-mono-tech" style={{ color: '#ff2020', fontSize: '0.6rem', letterSpacing: '0.3em' }}>
              ◆ THE PROBLEM
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,32,32,0.15)' }} />
            <span className="font-mono-tech" style={{ color: 'rgba(255,32,32,0.3)', fontSize: '0.55rem', letterSpacing: '0.2em' }}>
              WHAT ML ENGINEERS WASTE MONEY ON
            </span>
          </div>

          {/* Problem tabs */}
          <div className="flex gap-3 mb-5 flex-wrap">
            {GPU_PROBLEMS.map((p, i) => (
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
            <div className="flex items-center gap-3 px-4 py-2 border-b" style={{ borderColor: 'rgba(255,32,32,0.12)' }}>
              {['#ff2e2e','#ffb300','#00e676'].map((c,i) => (
                <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              ))}
              <span className="font-mono-tech" style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>
                bash — gpu_pain.log — {GPU_PROBLEMS[activeProblem].id}
              </span>
              <div className="ml-auto">
                <span className="font-mono-tech px-2 py-0.5 border" style={{
                  fontSize: '0.55rem', color: '#ff2020', borderColor: 'rgba(255,32,32,0.3)',
                }}>⚠ OOM</span>
              </div>
            </div>
            <pre className="font-mono-tech p-5 overflow-auto" style={{
              fontSize: '0.68rem', lineHeight: 2, whiteSpace: 'pre-wrap', color: 'var(--text-dim)',
            }}>
              {GPU_PROBLEMS[activeProblem].snippet.split('\n').map((line, i) => {
                let color = 'var(--text-dim)'
                if (line.startsWith('torch.cuda') || line.startsWith('RuntimeError')) color = '#ff2020'
                if (line.startsWith('  ') && !line.startsWith('  #') && !line.startsWith('  opt') && !line.startsWith('  act') && !line.startsWith('  gra') && !line.startsWith('  tot') && !line.startsWith('  No') && !line.startsWith('  You') && !line.startsWith('  Exp')) color = '#ff5555'
                if (line.startsWith('>>>')) color = 'rgba(0,229,255,0.6)'
                if (line.startsWith('#')) color = 'rgba(0,229,255,0.3)'
                return <div key={i} style={{ color }}>{line}</div>
              })}
            </pre>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION C — THE SOLUTION (memory breakdown + gauge)
        ══════════════════════════════════════════════════════ */}
        <div className="mb-20" style={{
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(30px)',
          transition: 'all 0.8s ease 0.4s',
        }}>
          <div className="flex items-center gap-4 mb-8">
            <span className="font-mono-tech" style={{ color: 'var(--cyan)', fontSize: '0.6rem', letterSpacing: '0.3em' }}>
              ◆ THE SOLUTION
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(0,229,255,0.15)' }} />
            <span className="font-mono-tech" style={{ color: 'rgba(0,229,255,0.3)', fontSize: '0.55rem', letterSpacing: '0.2em' }}>
              KNOW BEFORE YOU RENT
            </span>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left — model selector + gauge */}
            <div className="lg:col-span-2 space-y-4">
              <div className="border p-4" style={{ borderColor: 'rgba(0,229,255,0.15)', background: 'rgba(5,5,8,0.7)' }}>
                <div className="font-mono-tech mb-3" style={{ color: 'var(--text-dim)', fontSize: '0.6rem', letterSpacing: '0.2em' }}>
                  MODEL REGISTRY
                </div>
                {MODELS.map((m, i) => (
                  <button key={i} onClick={() => setSelected(i)}
                    className="w-full text-left p-3 border mb-2 transition-all duration-200"
                    style={{
                      borderColor: selected === i ? 'rgba(0,229,255,0.5)' : 'rgba(0,229,255,0.08)',
                      background: selected === i ? 'rgba(0,229,255,0.06)' : 'transparent',
                    }}>
                    <div className="flex justify-between items-center">
                      <span className="font-mono-tech text-xs" style={{ color: selected === i ? 'var(--cyan)' : 'var(--text-dim)' }}>
                        {m.name}
                      </span>
                      <span className="font-mono-tech" style={{
                        color: selected === i ? 'var(--cyan)' : 'var(--text-dim)', fontSize: '0.6rem',
                      }}>{m.vram}</span>
                    </div>
                    <div className="mt-1.5 h-px w-full bg-gray-900 relative overflow-hidden">
                      <div className="h-full absolute left-0 transition-all duration-500" style={{
                        width: `${m.util}%`,
                        background: m.util > 95
                          ? 'linear-gradient(to right, #ff5e1a, #ff2020)'
                          : 'linear-gradient(to right, #0097a7, #00e5ff)',
                        boxShadow: m.util > 95 ? '0 0 8px rgba(255,94,26,0.5)' : '0 0 8px rgba(0,229,255,0.3)',
                      }} />
                    </div>
                    <div className="font-mono-tech mt-1" style={{ color: 'var(--text-dim)', fontSize: '0.55rem', letterSpacing: '0.1em' }}>
                      {m.params} params / {m.util}% A100-80G util
                    </div>
                  </button>
                ))}
              </div>

              {/* GPU gauge */}
              <div className="border p-4" style={{ borderColor: 'rgba(0,229,255,0.15)', background: 'rgba(5,5,8,0.7)' }}>
                <div className="font-mono-tech mb-3" style={{ color: 'var(--text-dim)', fontSize: '0.6rem', letterSpacing: '0.2em' }}>
                  VRAM GAUGE — A100-80G
                </div>
                <div className="relative h-4 border" style={{ borderColor: 'rgba(0,229,255,0.2)', background: 'rgba(0,0,0,0.4)' }}>
                  <div className="h-full transition-all duration-700" style={{
                    width: `${MODELS[selected].util}%`,
                    background: MODELS[selected].util > 95
                      ? 'linear-gradient(to right, rgba(255,94,26,0.5), rgba(255,32,32,0.8))'
                      : 'linear-gradient(to right, rgba(0,100,120,0.8), rgba(0,229,255,0.7))',
                    boxShadow: MODELS[selected].util > 95
                      ? '0 0 20px rgba(255,94,26,0.5)'
                      : '0 0 20px rgba(0,229,255,0.3)',
                  }} />
                  {[25,50,75].map(pct => (
                    <div key={pct} className="absolute top-0 bottom-0 w-px"
                      style={{ left: `${pct}%`, background: 'rgba(0,229,255,0.1)' }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1 font-mono-tech" style={{ color: 'var(--text-dim)', fontSize: '0.55rem' }}>
                  <span>0 GB</span>
                  <span style={{ color: MODELS[selected].util > 95 ? 'var(--ember)' : 'var(--cyan)' }}>
                    {MODELS[selected].vram}
                  </span>
                  <span>80 GB</span>
                </div>
              </div>
            </div>

            {/* Right — memory breakdown */}
            <div className="lg:col-span-3">
              <div className="border p-6" style={{ borderColor: 'rgba(0,229,255,0.15)', background: 'rgba(5,5,8,0.7)' }}>
                <div className="font-mono-tech mb-5" style={{ color: 'var(--text-dim)', fontSize: '0.6rem', letterSpacing: '0.2em' }}>
                  MEMORY BREAKDOWN — {MODELS[selected].name}
                </div>
                {/* Stacked bar */}
                <div className="flex h-8 mb-4 overflow-hidden border" style={{ borderColor: 'rgba(0,229,255,0.1)' }}>
                  {MEMORY_BREAKDOWN.map((m,i) => (
                    <div key={i} className="h-full transition-all duration-700" style={{
                      width: `${m.pct}%`, background: m.color, opacity: 0.7,
                      boxShadow: i===0 ? 'inset -4px 0 8px rgba(0,0,0,0.5)' : undefined,
                    }} />
                  ))}
                </div>
                {MEMORY_BREAKDOWN.map((m,i) => (
                  <div key={i} className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 flex-shrink-0" style={{ background: m.color, opacity: 0.8 }} />
                    <div className="flex-1 h-px" style={{ background: 'rgba(0,229,255,0.06)' }} />
                    <span className="font-mono-tech text-xs" style={{ color: 'var(--text-dim)', fontSize: '0.65rem', minWidth: '140px' }}>
                      {m.label}
                    </span>
                    <span className="font-mono-tech" style={{ color: m.color, fontSize: '0.7rem', minWidth: '60px', textAlign: 'right' }}>
                      {m.gb} GB
                    </span>
                    <span className="font-mono-tech" style={{ color: 'var(--text-dim)', fontSize: '0.6rem', minWidth: '36px', textAlign: 'right' }}>
                      {m.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION D — FEATURES
        ══════════════════════════════════════════════════════ */}
        <div style={{
          opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(30px)',
          transition: 'all 0.8s ease 0.6s',
        }}>
          <div className="flex items-center gap-4 mb-8">
            <span className="font-mono-tech" style={{ color: 'var(--cyan)', fontSize: '0.6rem', letterSpacing: '0.3em' }}>
              ◆ FEATURES
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(0,229,255,0.15)' }} />
            <span className="font-mono-tech" style={{ color: 'rgba(0,229,255,0.3)', fontSize: '0.55rem', letterSpacing: '0.2em' }}>
              WHAT NV-GME CAN DO
            </span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left — screenshot + gif placeholders */}
            <div className="space-y-4">
              {/* Screenshot placeholder */}
              <div className="border relative overflow-hidden" style={{
                borderColor: 'rgba(0,229,255,0.15)', background: 'rgba(5,5,8,0.7)', height: '220px',
              }}>
                <div className="flex items-center gap-3 px-3 py-2 border-b" style={{ borderColor: 'rgba(0,229,255,0.1)' }}>
                  {['#ff2e2e','#ffb300','#00e676'].map((c,i) => (
                    <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  ))}
                  <span className="font-mono-tech" style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>
                    nv-gme :: ui.screenshot — ESTIMATOR VIEW
                  </span>
                  <div className="ml-auto">
                    <span className="font-mono-tech px-2 py-0.5 border" style={{
                      fontSize: '0.5rem', letterSpacing: '0.1em',
                      color: 'rgba(0,229,255,0.5)', borderColor: 'rgba(0,229,255,0.2)',
                    }}>PLACEHOLDER</span>
                  </div>
                </div>
                <div className="absolute inset-0 top-9" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(0,229,255,0.025) 28px,rgba(0,229,255,0.025) 29px), repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(0,229,255,0.025) 28px,rgba(0,229,255,0.025) 29px)',
                }} />
                <div className="absolute inset-0 top-9 flex items-center justify-center">
                  <div className="text-center">
                    <div className="font-mono-tech mb-2" style={{ color: 'rgba(0,229,255,0.2)', fontSize: '2rem' }}>◈</div>
                    <div className="font-mono-tech" style={{ color: '#FFF', fontSize: '0.6rem', letterSpacing: '0.2em' }}>
                      DEVELOPMENT IN PROGRESS
                    </div>
                    <div className="font-mono-tech mt-1" style={{ color: 'rgba(0,229,255,0.15)', fontSize: '0.5rem', letterSpacing: '0.1em' }}>
                    
                    </div>
                  </div>
                </div>
              </div>

              {/* GIF placeholder */}
              <div className="border relative overflow-hidden" style={{
                borderColor: 'rgba(0,229,255,0.15)', background: 'rgba(5,5,8,0.7)', height: '180px',
              }}>
                <div className="flex items-center gap-3 px-3 py-2 border-b" style={{ borderColor: 'rgba(0,229,255,0.1)' }}>
                  {['#ff2e2e','#ffb300','#00e676'].map((c,i) => (
                    <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  ))}
                  <span className="font-mono-tech" style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>
                    nv-gme :: demo.gif — BATCH SWEEP
                  </span>
                  <div className="ml-auto flex gap-2 items-center">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--cyan)' }} />
                    <span className="font-mono-tech" style={{ color: 'var(--cyan)', fontSize: '0.55rem', letterSpacing: '0.1em' }}>GIF</span>
                  </div>
                </div>
                <div className="absolute inset-0 top-9" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(0,229,255,0.025) 28px,rgba(0,229,255,0.025) 29px), repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(0,229,255,0.025) 28px,rgba(0,229,255,0.025) 29px)',
                }} />
                <div className="absolute inset-0 top-9 flex items-center justify-center">
                  <div className="text-center">
                    <div className="font-mono-tech mb-2" style={{ color: 'rgba(0,229,255,0.2)', fontSize: '1.6rem' }}>▶</div>
                    <div className="font-mono-tech" style={{ color: '#FFF', fontSize: '0.6rem', letterSpacing: '0.2em' }}>
                      DEVELOPMENT IN PROGRESS
                    </div>
                    <div className="font-mono-tech mt-1" style={{ color: 'rgba(0,229,255,0.15)', fontSize: '0.5rem', letterSpacing: '0.1em' }}>
                     
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — feature cards (interactive) */}
            <div>
              {/* Feature tabs */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {GME_FEATURES.map((f, i) => (
                  <button key={f.id} onClick={() => setActiveFeature(i)}
                    className="border p-3 text-left transition-all duration-200"
                    style={{
                      borderColor: activeFeature === i ? 'rgba(0,229,255,0.5)' : 'rgba(0,229,255,0.1)',
                      background: activeFeature === i ? 'rgba(0,229,255,0.07)' : 'rgba(5,5,8,0.5)',
                    }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: activeFeature === i ? 'var(--cyan)' : 'var(--text-dim)', fontSize: '0.75rem' }}>{f.icon}</span>
                      <span className="font-mono-tech" style={{
                        color: activeFeature === i ? 'var(--cyan)' : 'var(--text-dim)',
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
              <div className="border p-5" style={{ borderColor: 'rgba(0,229,255,0.2)', background: 'rgba(5,5,8,0.7)', minHeight: '160px' }}>
                <div className="flex items-center gap-3 mb-3">
                  <span style={{ color: 'var(--cyan)', fontSize: '1.2rem' }}>{GME_FEATURES[activeFeature].icon}</span>
                  <div>
                    <div className="font-mono-tech" style={{ color: 'var(--cyan)', fontSize: '0.65rem', letterSpacing: '0.12em' }}>
                      {GME_FEATURES[activeFeature].label}
                    </div>
                    <span className="font-mono-tech px-1.5 py-0.5 border" style={{
                      fontSize: '0.45rem', letterSpacing: '0.08em',
                      color: GME_FEATURES[activeFeature].badgeColor,
                      borderColor: `${GME_FEATURES[activeFeature].badgeColor}44`,
                      background: `${GME_FEATURES[activeFeature].badgeColor}11`,
                    }}>{GME_FEATURES[activeFeature].badge}</span>
                  </div>
                </div>
                <p className="font-body mb-3" style={{ color: 'var(--text)', fontSize: '0.75rem', lineHeight: 1.7 }}>
                  {GME_FEATURES[activeFeature].desc}
                </p>
                <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'rgba(0,229,255,0.1)' }}>
                  <span style={{ color: 'var(--cyan)', fontSize: '0.55rem' }}>◆</span>
                  <span className="font-mono-tech" style={{ color: 'rgba(0,229,255,0.5)', fontSize: '0.55rem', letterSpacing: '0.1em' }}>
                    {GME_FEATURES[activeFeature].detail}
                  </span>
                </div>
              </div>

              {/* Bottom summary grid */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {[
                  { icon: '◈', label: 'PRECISION MODE',           desc: 'FP16/BF16/INT8/INT4 dtype savings' },
                  { icon: '⬡', label: 'HARDWARE PROFILES',        desc: 'A100, H100, RTX 4090, V100' },
                  { icon: '◉', label: 'BATCH SCALING',            desc: 'VRAM growth across batch sizes' },
                  { icon: '◇', label: 'GRADIENT CHECKPOINTING',   desc: 'Memory vs compute trade-off sim' },
                ].map(({ icon, label, desc }) => (
                  <div key={label} className="border p-3" style={{ borderColor: 'rgba(0,229,255,0.08)', background: 'rgba(5,5,8,0.5)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: 'var(--cyan)', fontSize: '0.8rem' }}>{icon}</span>
                      <span className="font-mono-tech" style={{ color: 'var(--cyan)', fontSize: '0.5rem', letterSpacing: '0.08em' }}>{label}</span>
                    </div>
                    <p className="font-body" style={{ color: 'var(--text-dim)', fontSize: '0.65rem', lineHeight: 1.6 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer coordinates */}
          <div className="font-mono-tech flex items-center gap-6 mt-8" style={{
            color: 'var(--text-dim)', fontSize: '0.55rem', letterSpacing: '0.15em',
          }}>
            <span>SECTOR: NV-GME-02</span>
            <span style={{ color: 'rgba(0,229,255,0.3)' }}>◆</span>
            <span>ENGINE: ANALYTICAL</span>
            <span style={{ color: 'rgba(0,229,255,0.3)' }}>◆</span>
            <span>OUTPUT: DETERMINISTIC</span>
          </div>
        </div>

      </div>
    </section>
  )
}