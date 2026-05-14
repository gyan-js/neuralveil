import React, { useState, useEffect, useRef } from 'react'

function ForgeSpark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" style={{ animation: 'nvSpark 2.4s ease-in-out infinite' }}>
      <circle cx="11" cy="11" r="4.5" fill="none" stroke="#c9a84c" strokeWidth="0.8" opacity="0.35" />
      <circle cx="11" cy="11" r="2.2" fill="#c9a84c" opacity="0.95" />
      <line x1="11" y1="0.5" x2="11" y2="5"   stroke="#ff5e1a" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="11" y1="17"  x2="11" y2="21.5" stroke="#ff5e1a" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="0.5" y1="11" x2="5"   y2="11"  stroke="#ff5e1a" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="17"  y1="11" x2="21.5" y2="11" stroke="#ff5e1a" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="3"   y1="3"   x2="6.5" y2="6.5"   stroke="#c9a84c" strokeWidth="0.9" strokeLinecap="round" opacity="0.45" />
      <line x1="15.5" y1="15.5" x2="19" y2="19"   stroke="#c9a84c" strokeWidth="0.9" strokeLinecap="round" opacity="0.45" />
    </svg>
  )
}


function NavLink({ label, href, external }) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="nv-navlink font-mono-tech"
      style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', letterSpacing: '0.22em', textDecoration: 'none', position: 'relative' }}
    >
      {label}
    </a>
  )
}


function MobileDrawer({ open, onClose }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'opacity 0.3s',
        }}
      />
   
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 999,
          width: '75vw', maxWidth: 320,
          background: 'rgba(5,5,8,0.97)',
          borderLeft: '1px solid rgba(201,168,76,0.2)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
          display: 'flex', flexDirection: 'column',
          padding: '80px 36px 40px',
          gap: 8,
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(to right, transparent, #c9a84c, #ff5e1a, #c9a84c, transparent)',
          boxShadow: '0 0 24px rgba(201,168,76,0.5)',
        }} />

        <div className="font-mono-tech" style={{ color: 'rgba(201,168,76,0.4)', fontSize: '0.5rem', letterSpacing: '0.35em', marginBottom: 24 }}>
          ── NAVIGATION MATRIX ──
        </div>

        {[
          { label: 'HOME',   href: '#' },
          { label: 'TOOLS',  href: '#tools' },
          { label: 'GITHUB', href: 'https://github.com/gyan-js', external: true },
        ].map(({ label, href, external }, i) => (
          <a
            key={label}
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
            onClick={onClose}
            className="font-bebas nv-drawer-link"
            style={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: '1.6rem',
              letterSpacing: '0.2em',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(201,168,76,0.08)',
              paddingBottom: 12,
              paddingTop: 4,
              animationDelay: `${i * 60}ms`,
            }}
          >
            {label}
          </a>
        ))}

        <a
          href="#launch"
          onClick={onClose}
          className="font-mono-tech"
          style={{
            marginTop: 24,
            padding: '14px 0',
            border: '1px solid rgba(201,168,76,0.5)',
            color: '#c9a84c',
            fontSize: '0.75rem',
            letterSpacing: '0.2em',
            textAlign: 'center',
            textDecoration: 'none',
            background: 'rgba(201,168,76,0.06)',
            transition: 'all 0.2s',
          }}
        >
          TOOL LAUNCH
        </a>

        <div style={{ marginTop: 'auto', paddingTop: 24 }}>
          <div className="font-mono-tech" style={{ color: 'rgba(201,168,76,0.2)', fontSize: '0.5rem', letterSpacing: '0.15em', lineHeight: 2 }}>
            <div>BUILD :: 3.0.1-GAMMA</div>
            <div>STATUS :: PRE-RELEASE</div>
          </div>
        </div>
      </div>
    </>
  )
}


export default function Nav() {
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted]       = useState(false)
  const tickerRef = useRef(null)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  
  useEffect(() => {
    const el = tickerRef.current
    if (!el) return
    let pos = 0
    const speed = 0.4
    const tick = () => {
      pos -= speed
      if (pos < -el.scrollWidth / 2) pos = 0
      el.style.transform = `translateX(${pos}px)`
      requestAnimationFrame(tick)
    }
    const raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      <style>{`
        @keyframes nvSpark { 0%,100%{opacity:.8;filter:drop-shadow(0 0 2px #c9a84c)} 50%{opacity:1;filter:drop-shadow(0 0 8px #ff5e1a)} }
        @keyframes nvFadeDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes nvTickerBlink { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes nvPulse { 0%,100%{opacity:1;box-shadow:0 0 4px #ff5e1a} 50%{opacity:.6;box-shadow:0 0 10px #ff5e1a} }

        .nv-navlink {
          position: relative;
          transition: color 0.2s;
        }
        .nv-navlink::before {
          content: '';
          position: absolute;
          bottom: -3px; left: 0; right: 0; height: 1px;
          background: linear-gradient(to right, #c9a84c, #ff5e1a);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .nv-navlink:hover { color: #fff !important; }
        .nv-navlink:hover::before { transform: scaleX(1); }
        .nv-navlink::after {
          content: attr(data-label);
          position: absolute;
          inset: 0;
          color: #c9a84c;
          opacity: 0;
          transition: opacity 0.2s;
          text-shadow: 0 0 14px rgba(201,168,76,0.9);
          pointer-events: none;
        }
        .nv-navlink:hover::after { opacity: 1; }

        .nv-launch-btn {
          position: relative;
          overflow: hidden;
          transition: color 0.3s;
        }
        .nv-launch-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #c9a84c, #ff5e1a);
          transform: translateY(101%);
          transition: transform 0.35s cubic-bezier(0.16,1,0.3,1);
        }
        .nv-launch-btn:hover::before { transform: translateY(0); }
        .nv-launch-btn:hover { color: #050508 !important; border-color: transparent !important; }
        .nv-launch-btn span { position: relative; z-index: 1; }

        .nv-hamburger-line {
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
          transform-origin: center;
        }
        .nv-status-dot { animation: nvPulse 1.8s ease-in-out infinite; }
        .nv-mounted { animation: nvFadeDown 0.5s ease both; }
      `}</style>

     
      <div
        className="fixed top-0 left-0 right-0 z-50 overflow-hidden"
        style={{
          height: '22px',
          background: 'rgba(5,5,8,0.95)',
          borderBottom: '1px solid rgba(201,168,76,0.12)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          ref={tickerRef}
          className="font-mono-tech whitespace-nowrap"
          style={{
            fontSize: '0.48rem',
            letterSpacing: '0.2em',
            color: 'rgba(201,168,76,0.45)',
            willChange: 'transform',
          }}
        >
          {Array(4).fill(null).map((_, i) => (
            <span key={i}>
              &nbsp;&nbsp;&nbsp;◆&nbsp;&nbsp;&nbsp;
              NV-FORGE INITIALIZING&nbsp;&nbsp;&nbsp;◆&nbsp;&nbsp;&nbsp;
              BUILD 3.0.1-GAMMA&nbsp;&nbsp;&nbsp;◆&nbsp;&nbsp;&nbsp;
              TENSOR SHAPE DEBUGGER — READY&nbsp;&nbsp;&nbsp;◆&nbsp;&nbsp;&nbsp;
              GPU MEMORY ESTIMATOR — READY&nbsp;&nbsp;&nbsp;◆&nbsp;&nbsp;&nbsp;
              RELEASE: END OF MAY 2026&nbsp;&nbsp;&nbsp;◆&nbsp;&nbsp;&nbsp;
              APACHE-2.0 // FREE FOREVER&nbsp;&nbsp;&nbsp;◆&nbsp;&nbsp;&nbsp;
              AUTHOR: GYAN SHRESTH&nbsp;&nbsp;&nbsp;◆&nbsp;&nbsp;&nbsp;
              SIGNAL: NOMINAL&nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

  
      <nav
        className={mounted ? 'nv-mounted' : ''}
        style={{
          position: 'fixed',
          top: '22px',  /* sits below ticker */
          left: 0, right: 0,
          zIndex: 49,
          transition: 'background 0.5s, border-color 0.5s, box-shadow 0.5s',
          background: scrolled
            ? 'rgba(5,5,8,0.92)'
            : 'rgba(5,5,8,0.35)',
          backdropFilter: 'blur(20px)',
          borderBottom: scrolled
            ? '1px solid rgba(201,168,76,0.2)'
            : '1px solid rgba(201,168,76,0.06)',
          boxShadow: scrolled
            ? '0 4px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.04)'
            : 'none',
        }}
      >
        
        {scrolled && (
          <div style={{
            position: 'absolute', bottom: -1, left: 0, right: 0, height: 1,
            background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.4) 30%, rgba(255,94,26,0.3) 50%, rgba(201,168,76,0.4) 70%, transparent)',
            boxShadow: '0 0 20px rgba(201,168,76,0.2)',
            pointerEvents: 'none',
          }} />
        )}

        <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between" style={{ height: 56 }}>

        
          <a href="#" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }} className="group">
            <ForgeSpark size={24} />
            <span
              className="font-bebas tracking-widest"
              style={{
                fontSize: '1.25rem',
                letterSpacing: '0.18em',
                color: '#fff',
                transition: 'color 0.25s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#c9a84c'}
              onMouseLeave={e => e.currentTarget.style.color = '#fff'}
            >
              NEURALVEIL
            </span>
            <div
              className="font-mono-tech border"
              style={{
                fontSize: '0.52rem',
                letterSpacing: '0.12em',
                color: 'rgba(201,168,76,0.7)',
                borderColor: 'rgba(201,168,76,0.25)',
                background: 'rgba(201,168,76,0.06)',
                padding: '2px 7px',
              }}
            >
              3.0.1-GAMMA
            </div>
          </a>

          <div className="hidden md:flex items-center" style={{ gap: 36 }}>

            {[
              { label: 'HOME',  href: '#' },
              { label: 'TOOLS', href: '#tools' },
            ].map(({ label, href }) => (
              <NavLink key={label} label={label} href={href} />
            ))}

           
            <div style={{ width: 1, height: 18, background: 'rgba(201,168,76,0.15)' }} />

         
            <div
              className="font-mono-tech flex items-center gap-2"
              style={{
                fontSize: '0.52rem',
                letterSpacing: '0.2em',
                color: 'rgba(255,94,26,0.8)',
                border: '1px solid rgba(255,94,26,0.25)',
                background: 'rgba(255,94,26,0.06)',
                padding: '4px 10px',
              }}
            >
              <span
                className="nv-status-dot"
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#ff5e1a',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              PRE-RELEASE
            </div>

      
            <a
              href="#launch"
              className="nv-launch-btn font-mono-tech"
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.18em',
                padding: '9px 22px',
                border: '1px solid rgba(201,168,76,0.55)',
                color: '#c9a84c',
                textDecoration: 'none',
              }}
            >
              <span>TOOL LAUNCH</span>
            </a>
          </div>

    
          <button
            className="md:hidden flex flex-col items-end justify-center gap-1.5 p-2"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: 36, height: 36 }}
          >
            <span
              className="nv-hamburger-line block"
              style={{
                width: mobileOpen ? 20 : 20,
                height: 1,
                background: '#c9a84c',
                transform: mobileOpen ? 'translateY(5px) rotate(45deg)' : 'none',
              }}
            />
            <span
              className="nv-hamburger-line block"
              style={{
                width: 14,
                height: 1,
                background: '#ff5e1a',
                opacity: mobileOpen ? 0 : 0.7,
                transform: mobileOpen ? 'scaleX(0)' : 'none',
              }}
            />
            <span
              className="nv-hamburger-line block"
              style={{
                width: mobileOpen ? 20 : 20,
                height: 1,
                background: '#c9a84c',
                opacity: mobileOpen ? 1 : 0.45,
                transform: mobileOpen ? 'translateY(-5px) rotate(-45deg)' : 'none',
              }}
            />
          </button>
        </div>
      </nav>

      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}