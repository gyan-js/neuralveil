import React, { useEffect, useRef } from 'react'


function EmberCanvas({ count = 18 }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = canvas.width = canvas.offsetWidth
    let H = canvas.height = canvas.offsetHeight
    const particles = Array.from({ length: count }, () => spawnParticle(W, H))
    function spawnParticle(w, h) {
      return {
        x: Math.random() * w,
        y: h + Math.random() * 20,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(0.4 + Math.random() * 0.9),
        life: 0,
        maxLife: 120 + Math.random() * 80,
        size: 1 + Math.random() * 2,
        hue: Math.random() < 0.6 ? 35 : 15,
      }
    }
    let raf
    function draw() {
      ctx.clearRect(0, 0, W, H)
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life++
        const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.7
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue},100%,65%,${alpha})`
        ctx.fill()
        if (p.life >= p.maxLife) particles[i] = spawnParticle(W, H)
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    const ro = new ResizeObserver(() => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight })
    ro.observe(canvas)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [count])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.55 }} />
}

function ForgeSpark() {
  return (
    <svg width="26" height="26" viewBox="0 0 22 22" fill="none" style={{ animation: 'pulse 2s ease-in-out infinite' }}>
      <circle cx="11" cy="11" r="5" fill="none" stroke="#c9a84c" strokeWidth="0.8" opacity="0.4" />
      <circle cx="11" cy="11" r="2.5" fill="#c9a84c" opacity="0.95" />
      <line x1="11" y1="1" x2="11" y2="5" stroke="#ff5e1a" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="11" y1="17" x2="11" y2="21" stroke="#ff5e1a" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="1" y1="11" x2="5" y2="11" stroke="#ff5e1a" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="17" y1="11" x2="21" y2="11" stroke="#ff5e1a" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="3.5" y1="3.5" x2="6.5" y2="6.5" stroke="#c9a84c" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <line x1="15.5" y1="15.5" x2="18.5" y2="18.5" stroke="#c9a84c" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

const NAV = [
  { label: 'Tensor Shape Debugger', href: '#tools', tag: 'TOOL' },
  { label: 'GPU Memory Estimator',  href: '#tools', tag: 'TOOL' },
  { label: 'GitHub',                href: 'https://github.com/gyan-js', tag: 'DEV', external: true },
  { label: 'Apache 2.0 License',   href: 'https://www.apache.org/licenses/LICENSE-2.0', tag: 'OSS', external: true },
]

const SIG = [
  { key: 'BUILD',   val: '3.0.1-GAMMA' },
  { key: 'LICENSE', val: 'APACHE-2.0' },
  { key: 'AUTHOR',  val: 'GYAN SHRESTH' },
  { key: 'STATUS',  val: 'PRE-RELEASE' },
]

export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden"
      style={{
        background: 'var(--bg)',
        borderTop: '1px solid rgba(201,168,76,0.12)',
      }}
    >
      <style>{`
        @keyframes pulse { 0%,100%{opacity:.8} 50%{opacity:1} }
        @keyframes scanline {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(800%); opacity: 0; }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .nv-link {
          position: relative;
          transition: color 0.2s;
        }
        .nv-link::after {
          content: '';
          position: absolute;
          left: 0; bottom: -2px;
          width: 0; height: 1px;
          background: #c9a84c;
          transition: width 0.25s ease;
        }
        .nv-link:hover::after { width: 100%; }
        .nv-link:hover { color: #c9a84c !important; }
        .sig-row:hover .sig-val { color: #c9a84c; }
        .sig-row { transition: all 0.15s; }
        .cursor-blink { animation: blink 1.1s step-end infinite; }
      `}</style>

      {/* Top glowing border — thicker + sharper */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(to right, transparent, #c9a84c 20%, #ff5e1a 50%, #c9a84c 80%, transparent)',
        boxShadow: '0 0 32px rgba(201,168,76,0.4), 0 0 8px rgba(255,94,26,0.3)',
        zIndex: 2,
      }} />

      {/* Animated scanline */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        overflow: 'hidden', pointerEvents: 'none', zIndex: 1,
      }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '60px',
          background: 'linear-gradient(to bottom, transparent, rgba(201,168,76,0.03) 50%, transparent)',
          animation: 'scanline 6s linear infinite',
        }} />
      </div>

      <EmberCanvas count={20} />

      {/* Grid overlay texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        zIndex: 1,
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-14 pb-8">

        {/* ── MAIN GRID ── */}
        <div className="grid md:grid-cols-3 gap-10 items-start">

          {/* ── LEFT: Branding ── */}
          <div>
            <a href="#" className="inline-flex items-center gap-3 group mb-4" style={{ textDecoration: 'none' }}>
              <ForgeSpark />
              <span
                className="font-bebas tracking-widest text-white group-hover:text-yellow-400 transition-colors duration-300"
                style={{ fontSize: '1.4rem', letterSpacing: '0.18em' }}
              >
                NEURALVEIL
              </span>
              <span
                className="font-mono-tech border px-2 py-0.5 text-white"
                style={{
                  fontSize: '0.58rem',
                  borderColor: 'rgba(201,168,76,0.35)',
                  background: 'rgba(201,168,76,0.07)',
                  letterSpacing: '0.12em',
                }}
              >
                3.0.1-GAMMA
              </span>
            </a>

            <p
              className="font-mono-tech leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem', letterSpacing: '0.1em', lineHeight: 2 }}
            >
              Solo-built research infrastructure.<br />
              Not a startup. Not a product team.<br />
              Just the tools the field actually needs.
            </p>

            {/* Live status pill */}
            <div
              className="inline-flex items-center gap-2 mt-5 px-3 py-1.5 border"
              style={{
                borderColor: 'rgba(255,94,26,0.3)',
                background: 'rgba(255,94,26,0.07)',
                fontSize: '0.58rem',
                fontFamily: 'monospace',
                letterSpacing: '0.15em',
                color: '#ff5e1a',
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#ff5e1a',
                boxShadow: '0 0 6px #ff5e1a',
                display: 'inline-block',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
              FORGE ACTIVE — PRE-RELEASE
            </div>
          </div>

          {/* ── CENTER: Navigation ── */}
          <div>
            <div
              className="font-mono-tech mb-5"
              style={{ color: 'rgba(201,168,76,0.5)', fontSize: '0.58rem', letterSpacing: '0.3em' }}
            >
              ── NAVIGATION ──
            </div>
            <div className="flex flex-col gap-3">
              {NAV.map(({ label, href, tag, external }) => (
                <a
                  key={label}
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noreferrer' : undefined}
                  className="nv-link font-mono-tech flex items-center gap-3"
                  style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem', letterSpacing: '0.08em', textDecoration: 'none' }}
                >
                  <span
                    className="font-mono-tech"
                    style={{
                      fontSize: '0.5rem',
                      letterSpacing: '0.15em',
                      padding: '1px 5px',
                      border: '1px solid rgba(201,168,76,0.25)',
                      color: 'rgba(201,168,76,0.6)',
                      background: 'rgba(201,168,76,0.05)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tag}
                  </span>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* ── RIGHT: System Signature ── */}
          <div>
            <div
              className="font-mono-tech mb-5"
              style={{ color: 'rgba(201,168,76,0.5)', fontSize: '0.58rem', letterSpacing: '0.3em', textAlign: 'right' }}
            >
              ── SYSTEM SIGNATURE ──
            </div>

            <div className="flex flex-col gap-2.5">
              {SIG.map(({ key, val }) => (
                <div
                  key={key}
                  className="sig-row flex justify-between items-center gap-6 font-mono-tech"
                  style={{
                    fontSize: '0.68rem',
                    letterSpacing: '0.1em',
                    borderBottom: '1px solid rgba(201,168,76,0.07)',
                    paddingBottom: '6px',
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>{key}</span>
                  <span className="sig-val font-bold transition-colors duration-200" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="mt-5 font-mono-tech text-right"
              style={{ color: 'rgba(201,168,76,0.35)', fontSize: '0.55rem', letterSpacing: '0.15em' }}
            >
              © 2026 NEURALVEIL<br />
              BUILT ALONE. BUILT RIGHT.
            </div>
          </div>
        </div>

        {/* ── BOTTOM STRIP ── */}
        <div
          className="mt-10 pt-4 font-mono-tech flex flex-wrap justify-between items-center gap-3"
          style={{
            borderTop: '1px solid rgba(201,168,76,0.08)',
            fontSize: '0.55rem',
            letterSpacing: '0.18em',
            color: 'rgba(201,168,76,0.25)',
          }}
        >
          <span>NV-FORGE // SECTOR_FINAL // COORD 0000,0000</span>
          <span style={{ color: 'rgba(255,94,26,0.4)' }}>
            RENDER: COMPLETE <span className="cursor-blink">█</span>
          </span>
          <span>SIGNAL: NOMINAL</span>
        </div>
      </div>
    </footer>
  )
}