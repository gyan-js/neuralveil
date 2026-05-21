import { useState, useEffect, useRef } from 'react'

const ribbonTerms = [
  'FSDP', '∿ FORWARD PASS', 'TENSOR PARALLEL', '∇ GRAD NORM',
  'BF16', 'ACTIVATION CHECKPOINTING', 'DDP', '⊗ SHAPE TRACE',
  'VRAM ESTIMATOR', 'WASM RUNTIME', 'OOM PREVENTION', 'ATTENTION HEADS',
  'LAYER NORM', '∑ PARAM COUNT', 'RESIDUAL STREAM', 'MIXED PRECISION',
  'RANK ZERO', 'OPTIMIZER STATE', 'GRADIENT BUCKET', '∅ ZERO BACKEND',
  'PYODIDE', 'BFLOAT16', 'TENSOR RANK', 'WEIGHT DECAY',
]

function Ribbon() {
  const repeated = [...ribbonTerms, ...ribbonTerms, ...ribbonTerms]
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 102,
      height: '24px',
      backgroundColor: 'var(--ember, #e8650a)',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        animation: 'ribbon-scroll 40s linear infinite',
        whiteSpace: 'nowrap',
        willChange: 'transform',
      }}>
        {repeated.map((term, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span
              className="font-mono-jb"
              style={{
                fontSize: '9px',
                letterSpacing: '0.18em',
                color: i % 5 === 0 ? 'rgba(10,7,4,0.45)' : 'rgba(10,7,4,0.85)',
                fontWeight: i % 7 === 0 ? '700' : '400',
                padding: '0 14px',
              }}
            >
              {term}
            </span>
            <span style={{
              width: '3px', height: '3px', borderRadius: '50%',
              backgroundColor: 'rgba(10,7,4,0.3)', flexShrink: 0,
            }} />
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ribbon-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  )
}

const navLinks = [
  { label: 'Tools', tag: '02', href: '#tools' },

  { label: 'GitHub', tag: '↗', href: 'https://github.com/gyan-js' },
]

const statusPings = [
  { label: 'WASM',     color: '#4caf80' },
  { label: 'TRACER',   color: '#4caf80' },
  { label: 'VRAM EST', color: '#ffb347' },
]

// ── Sidebar overlay for mobile ──────────────────────────────────────────────
function MobileSidebar({ open, onClose, tick }) {
  const sidebarRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
     
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          backgroundColor: 'rgba(6,4,2,0.7)',
          backdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      <div
        ref={sidebarRef}
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          zIndex: 201,
          width: '280px',
          backgroundColor: 'rgba(8,5,2,0.98)',
          borderLeft: '1px solid rgba(232,101,10,0.2)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: '24px', // ribbon height
        }}
      >

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 28px 20px',
          borderBottom: '1px solid rgba(232,101,10,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
       
            
            <span className="font-bebas" style={{
              fontSize: '16px', letterSpacing: '0.22em', color: 'var(--flame,#ff6b1a)',
            }}>
              NEURALVEIL
            </span>
          </div>

     
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid rgba(232,101,10,0.2)',
              color: 'rgba(232,101,10,0.6)', cursor: 'pointer',
              width: '28px', height: '28px', borderRadius: '2px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', lineHeight: 1,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(232,101,10,0.1)'; e.currentTarget.style.color = 'var(--ember)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(244,196,90,0.6)' }}
          >
            ✕
          </button>
        </div>

        <div style={{
          display: 'flex', gap: '20px',
          padding: '16px 28px',
          borderBottom: '1px solid rgba(138,117,96,0.08)',
        }}>
          {statusPings.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '5px', height: '5px', borderRadius: '50%',
                backgroundColor: s.color,
                boxShadow: `0 0 ${tick % 2 === 0 ? '6px' : '3px'} ${s.color}`,
                transition: 'box-shadow 0.5s ease',
              }} />
              <span className="font-mono-jb" style={{ fontSize: '9px', color: 'rgba(138,117,96,0.6)', letterSpacing: '0.1em' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navLinks.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 28px',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(138,117,96,0.06)',
                transition: 'background-color 0.2s ease',
                group: true,
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(232,101,10,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="font-mono-jb" style={{ fontSize: '8px', color: 'rgba(232,101,10,0.4)', letterSpacing: '0.12em', minWidth: '16px' }}>
                  {link.tag}
                </span>
                <span className="font-mono-jb" style={{ fontSize: '13px', color: 'rgba(200,184,154,0.8)', letterSpacing: '0.1em' }}>
                  {link.label.toUpperCase()}
                </span>
              </div>
              <span style={{ color: 'rgba(232,101,10,0.3)', fontSize: '12px' }}>→</span>
            </a>
          ))}
        </nav>

        <div style={{ padding: '24px 28px', borderTop: '1px solid rgba(232,101,10,0.1)' }}>
          <a href='#launch'>
          <button
            className="font-mono-jb"
            style={{
              width: '100%',
              backgroundColor: 'var(--ember,#e8650a)',
              color: '#0a0705',
              border: 'none',
              padding: '14px 0',
              fontSize: '11px',
              letterSpacing: '0.14em',
              fontWeight: '700',
              cursor: 'pointer',
              borderRadius: '2px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--flame,#ff6b1a)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--ember,#e8650a)'}
          >
            TOOLKIT LAUNCH
          </button>
          </a>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <span className="font-mono-jb" style={{ fontSize: '9px', color: 'rgba(232,101,10,0.4)', border: '1px solid rgba(232,101,10,0.15)', padding: '2px 7px', borderRadius: '2px', letterSpacing: '0.14em' }}>
              V3.0.1
            </span>
            <span className="font-mono-jb" style={{ fontSize: '9px', color: 'rgba(138,117,96,0.4)', letterSpacing: '0.08em', fontVariantNumeric: 'tabular-nums' }}>
              ML INTROSPECTION TOOLKIT
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

function HamburgerButton({ open, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={open ? 'Close menu' : 'Open menu'}
      style={{
        background: 'none',
        border: '1px solid rgba(232,101,10,0.2)',
        cursor: 'pointer',
        width: '36px', height: '36px',
        borderRadius: '2px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '5px', flexShrink: 0,
        transition: 'border-color 0.2s ease, background-color 0.2s ease',
        padding: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(244,196,90,0.5)'; e.currentTarget.style.backgroundColor = 'rgba(232,101,10,0.06)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(244,196,90,0.2)'; e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          display: 'block',
          width: open
            ? i === 1 ? '0px' : '16px'
            : '16px',
          height: '1.5px',
          backgroundColor: 'rgba(244,196,90,0.7)',
          borderRadius: '1px',
          transition: 'all 0.25s ease',
          transform: open
            ? i === 0 ? 'translateY(6.5px) rotate(45deg)' : i === 2 ? 'translateY(-6.5px) rotate(-45deg)' : ''
            : '',
          opacity: open && i === 1 ? 0 : 1,
        }} />
      ))}
    </button>
  )
}

// ── Main Navbar ─────────────────────────────────────────────────────────────
export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false)
  const [tick, setTick]             = useState(0)
  const [activeLink, setActiveLink] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const now = new Date()
  const timeStr = now.toTimeString().slice(0, 8)

  return (
    <>
      <Ribbon />

      <MobileSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        tick={tick}
      />

      <nav style={{
        position: 'fixed',
        top: '24px', left: 0, right: 0,
        zIndex: 100,
        height: '56px',
        display: 'flex',
        alignItems: 'stretch',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        backgroundColor: scrolled ? 'rgba(6,4,2,0.97)' : 'rgba(8,5,2,0.82)',
        borderBottom: `1px solid ${scrolled ? 'rgba(232,101,10,0.3)' : 'rgba(232,101,10,0.12)'}`,
        transition: 'all 0.4s ease',
      }}>

    
        <div style={{
          display: 'flex', alignItems: 'center',
          paddingLeft: '28px', paddingRight: '28px',
          borderRight: '1px solid rgba(232,101,10,0.12)',
          gap: '12px', flexShrink: 0,
        }}>
          {/* 
          <div style={{
            width: '20px', height: '20px',
            border: '1px solid rgba(232,101,10,0.5)',
            position: 'relative', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: '8px', height: '8px',
              backgroundColor: 'var(--ember,#e8650a)',
              animation: 'pulse-ember 2s ease-in-out infinite',
            }} />
            {[
              { top: '-3px', left: '-3px' },
              { top: '-3px', right: '-3px' },
              { bottom: '-3px', left: '-3px' },
              { bottom: '-3px', right: '-3px' },
            ].map((pos, i) => (
              <div key={i} style={{
                position: 'absolute', width: '4px', height: '4px',
                borderTop:    i < 2  ? '1px solid rgba(232,101,10,0.7)' : 'none',
                borderBottom: i >= 2 ? '1px solid rgba(232,101,10,0.7)' : 'none',
                borderLeft:  i % 2 === 0 ? '1px solid rgba(232,101,10,0.7)' : 'none',
                borderRight: i % 2 === 1 ? '1px solid rgba(232,101,10,0.7)' : 'none',
                ...pos,
              }} />
            ))}
          </div>
            */}
     
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span className="font-bebas" style={{
              fontSize: '20px', letterSpacing: '0.22em',
              color: 'var(--flame,#ff6b1a)', lineHeight: 1,
            }}>
              NEURALVEIL
            </span>
            <span className="font-mono-jb nav-subtitle" style={{
              fontSize: '8px', letterSpacing: '0.18em',
              color: 'rgba(232,101,10,0.4)', marginTop: '1px',
            }}>
              ML INTROSPECTION TOOLKIT
            </span>
          </div>
        </div>


        <div className="nav-version" style={{
          display: 'flex', alignItems: 'center',
          paddingLeft: '20px', paddingRight: '20px',
          borderRight: '1px solid rgba(138,117,96,0.1)',
          flexShrink: 0,
        }}>
          <span className="font-mono-jb" style={{
            fontSize: '9px', letterSpacing: '0.14em',
            color: 'rgba(232,101,10,0.5)',
            border: '1px solid rgba(232,101,10,0.2)',
            padding: '2px 8px', borderRadius: '2px',
          }}>
            V3.0.1
          </span>
        </div>

   
        <div className="nav-status" style={{
          display: 'flex', alignItems: 'center', gap: '22px',
          paddingLeft: '24px', paddingRight: '24px',
          borderRight: '1px solid rgba(138,117,96,0.1)',
          flexShrink: 0,
        }}>
          {statusPings.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '5px', height: '5px', borderRadius: '50%',
                backgroundColor: s.color,
                boxShadow: `0 0 ${tick % 2 === 0 ? '6px' : '3px'} ${s.color}`,
                transition: 'box-shadow 0.5s ease',
                flexShrink: 0,
              }} />
              <span className="font-mono-jb" style={{
                fontSize: '9px', color: 'rgba(138,117,96,0.6)', letterSpacing: '0.1em',
              }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

    
        <div style={{ flex: 1 }} />


        <div className="nav-links" style={{
          display: 'flex', alignItems: 'stretch',
          borderLeft: '1px solid rgba(138,117,96,0.1)',
        }}>
          {navLinks.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              onMouseEnter={() => setActiveLink(i)}
              onMouseLeave={() => setActiveLink(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '0 26px',
                borderRight: i < navLinks.length - 1 ? '1px solid rgba(138,117,96,0.1)' : 'none',
                textDecoration: 'none',
                position: 'relative',
                backgroundColor: activeLink === i ? 'rgba(232,101,10,0.06)' : 'transparent',
                transition: 'background-color 0.2s ease',
              }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '2px',
                backgroundColor: 'var(--ember,#e8650a)',
                transform: `scaleX(${activeLink === i ? 1 : 0})`,
                transformOrigin: 'left',
                transition: 'transform 0.2s ease',
              }} />
              <span className="font-mono-jb" style={{
                fontSize: '8px', letterSpacing: '0.1em',
                color: activeLink === i ? 'rgba(232,101,10,0.6)' : 'rgba(90,96,112,0.5)',
                transition: 'color 0.2s ease',
              }}>
                {link.tag}
              </span>
              <span className="font-mono-jb" style={{
                fontSize: '12px', letterSpacing: '0.1em',
                color: activeLink === i ? 'var(--ember,#e8650a)' : 'rgba(138,120,100,0.8)',
                transition: 'color 0.2s ease',
                fontWeight: activeLink === i ? '600' : '400',
              }}>
                {link.label.toUpperCase()}
              </span>
            </a>
          ))}
        </div>

   
        <div className="nav-clock" style={{
          display: 'flex', alignItems: 'center',
          paddingLeft: '20px', paddingRight: '20px',
          borderLeft: '1px solid rgba(138,117,96,0.1)',
          flexShrink: 0,
        }}>
          <span className="font-mono-jb" style={{
            fontSize: '10px',
            color: 'rgba(138,117,96,0.45)',
            letterSpacing: '0.08em',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {timeStr}
          </span>
        </div>


        <div className="nav-cta" style={{
          display: 'flex', alignItems: 'center',
          paddingLeft: '16px', paddingRight: '28px',
          borderLeft: '1px solid rgba(138,117,96,0.1)',
          flexShrink: 0,
        }}>
          <a href='#launch'>
          <button
            className="font-mono-jb"
            style={{
              backgroundColor: 'var(--ember,#e8650a)',
              color: '#0a0705', border: 'none',
              padding: '8px 20px',
              fontSize: '10px', letterSpacing: '0.12em', fontWeight: '700',
              cursor: 'pointer', borderRadius: '2px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--flame,#ff6b1a)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--ember,#e8650a)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            TOOLKIT LAUNCH
          </button>
          </a>
        </div>

      
        <div className="nav-hamburger" style={{
          display: 'none', alignItems: 'center',
          paddingLeft: '16px', paddingRight: '20px',
          borderLeft: '1px solid rgba(138,117,96,0.1)',
          flexShrink: 0,
        }}>
          <HamburgerButton open={sidebarOpen} onClick={() => setSidebarOpen(o => !o)} />
        </div>

      </nav>

      <style>{`
        @keyframes pulse-ember {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.75); }
        }


        @media (max-width: 900px) {
          .nav-version  { display: none !important; }
          .nav-clock    { display: none !important; }
          .nav-subtitle { display: none !important; }
        }
        @media (max-width: 640px) {
          .nav-status    { display: none !important; }
          .nav-links     { display: none !important; }
          .nav-cta       { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  )
}