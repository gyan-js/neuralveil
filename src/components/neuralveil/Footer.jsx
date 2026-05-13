import React from 'react'
import EmberParticles from './EmberParticles.jsx'
function ForgeSpark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="animate-pulse-slow">
      <circle cx="11" cy="11" r="4" fill="none" stroke="#c9a84c" strokeWidth="1" opacity="0.6" />
      <circle cx="11" cy="11" r="2" fill="#c9a84c" opacity="0.9" />
      <line x1="11" y1="1" x2="11" y2="5" stroke="#ff5e1a" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="17" x2="11" y2="21" stroke="#ff5e1a" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="1" y1="11" x2="5" y2="11" stroke="#ff5e1a" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17" y1="11" x2="21" y2="11" stroke="#ff5e1a" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3.5" y1="3.5" x2="6.5" y2="6.5" stroke="#c9a84c" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <line x1="15.5" y1="15.5" x2="18.5" y2="18.5" stroke="#c9a84c" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden border-t py-12"
      style={{
        borderColor: 'rgba(201,168,76,0.08)',
        background: 'var(--bg)',
      }}
    >
      {/* Subtle glowing divider */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.3) 20%, rgba(255,94,26,0.2) 50%, rgba(201,168,76,0.3) 80%, transparent)',
          boxShadow: '0 0 20px rgba(201,168,76,0.15)',
        }}
      />

      <EmberParticles count={6} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-3 gap-8 items-end">

          {/* Left — branding */}
          <div>
            <div
              className="font-bebas text-3xl tracking-widest mb-2"
              style={{ color: 'rgba(201,168,76,0.3)', letterSpacing: '0.15em' }}
            >
             <a href="#" className="flex items-center gap-3 group">
         <ForgeSpark />
          <span
            className="font-bebas text-xl tracking-widest text-white transition-all duration-300 group-hover:text-gold2"
            style={{ letterSpacing: '0.15em' }}
          >
            NEURALVEIL
          </span>
          <span
            className="font-mono-tech text-xs px-2 py-0.5 border rounded"
            style={{
              color: '#fff',
              borderColor: 'rgba(201,168,76,0.2)',
              fontSize: '0.6rem',
            }}
          >
            3.0.1-GAMMA
          </span>
        </a>
            </div>
            <div
              className="font-mono-tech"
              style={{ color: 'var(--text-dim)', fontSize: '0.6rem', letterSpacing: '0.15em', lineHeight: 2 }}
            >
              Solo-built research infrastructure.<br />
              Not a startup. Not a product team.<br />
              Just the tools the field actually needs.
            </div>
          </div>

          {/* Center — navigation */}
          <div className="flex flex-col gap-2">
            <div
              className="font-mono-tech mb-2"
              style={{ color: 'rgba(201,168,76,0.3)', fontSize: '0.55rem', letterSpacing: '0.25em' }}
            >
              NAVIGATION
            </div>
            {[
              { label: 'Tensor Shape Debugger', href: '#tools' },
              { label: 'GPU Memory Estimator',  href: '#tools' },
              { label: 'GitHub',                href: 'https://github.com/gyan-js', external: true },
              { label: 'Apache 2.0 License',    href: 'https://www.apache.org/licenses/LICENSE-2.0', external: true },
            ].map(({ label, href, external }) => (
              <a
                key={label}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
                className="font-mono-tech transition-colors duration-200 hover:opacity-80"
                style={{ color: 'var(--text-dim)', fontSize: '0.65rem', letterSpacing: '0.1em' }}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Right — system sig */}
          <div className="text-right">
            <div
              className="font-mono-tech mb-3"
              style={{ color: 'rgba(201,168,76,0.2)', fontSize: '0.55rem', letterSpacing: '0.2em' }}
            >
              SYSTEM SIGNATURE
            </div>

            {/* Tiny diagnostic grid */}
            <div className="flex flex-col gap-1 items-end font-mono-tech" style={{ fontSize: '0.55rem', color: 'var(--text-dim)', letterSpacing: '0.12em' }}>
            <span>NEURALVEIL::<span className='font-bold' >BUILD 3.0.1-gamma</span></span>
            <span>LICENSE::<span className='font-bold' >APACHE-2.0</span></span>
            <span>AUTHOR::<span className='font-bold' >GYAN SHRESTH</span></span>
            <span>STATUS::<span className='font-bold' >PRE-RELEASE</span></span>
            </div>

            <div
              className="mt-4 font-mono-tech"
              style={{ color: 'rgba(201,168,76,0.15)', fontSize: '0.5rem', letterSpacing: '0.15em' }}
            >
              © 2026 NEURALVEIL. BUILT ALONE. BUILT RIGHT.
            </div>
          </div>
        </div>

        {/* Bottom coordinate strip */}
        <div
          className="mt-8 pt-4 border-t flex flex-wrap justify-between items-center gap-4 font-mono-tech"
          style={{
            borderColor: 'rgba(201,168,76,0.05)',
            color: 'rgba(201,168,76,0.12)',
            fontSize: '0.5rem',
            letterSpacing: '0.15em',
          }}
        >
          <span>NV-FORGE // SECTOR_FINAL // COORD 0000,0000</span>
          <span>RENDER: COMPLETE</span>
          <span>SIGNAL: NOMINAL</span>
        </div>
      </div>
    </footer>
  )
}


