import React, { useState, useEffect } from 'react'
import neurallogo from '../../assets/logo.png'
export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled
          ? 'rgba(5,5,8,0.85)'
          : 'rgba(5,5,8,0.4)',
        backdropFilter: 'blur(16px)',
        borderBottom: scrolled
          ? '1px solid rgba(201,168,76,0.15)'
          : '1px solid rgba(201,168,76,0.05)',
        boxShadow: scrolled ? '0 0 40px rgba(201,168,76,0.05)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 group">
         <ForgeSpark />
          <span
            className="font-bebas text-xl tracking-widest text-gold transition-all duration-300 group-hover:text-gold2"
            style={{ letterSpacing: '0.15em' }}
          >
            NEURALVEIL
          </span>
          <span
            className="font-mono-tech text-xs px-2 py-0.5 border rounded"
            style={{
              color: 'var(--text-dim)',
              borderColor: 'rgba(201,168,76,0.2)',
              fontSize: '0.6rem',
            }}
          >
            3.0.1-GAMMA
          </span>
        </a>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'HOME',   href: '#' },
            { label: 'TOOLS',  href: '#tools' },
           
          ].map(({ label, href, external }) => (
            <a
              key={label}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              className="font-mono-tech text-xs tracking-widest transition-all duration-200 relative group"
              style={{ color: 'var(--text-dim)' }}
            >
              {label}
              <span
                className="absolute -bottom-1 left-0 right-0 h-px scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                style={{ background: 'var(--gold)' }}
              />
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ textShadow: '0 0 12px rgba(201,168,76,0.6)', color: 'var(--gold2)' }}
              >
                {label}
              </span>
            </a>
          ))}

          <a
            href="#launch"
            className="font-mono-tech text-xs tracking-widest px-5 py-2 border transition-all duration-300 relative overflow-hidden group"
            style={{
              borderColor: 'rgba(201,168,76,0.4)',
              color: 'var(--gold)',
              letterSpacing: '0.12em',
            }}
          >
            <span className="relative z-10 group-hover:text-bg transition-colors duration-300">LAUNCH APP</span>
            <span
              className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
              style={{ background: 'var(--gold)' }}
            />
          </a>
        </div>

        {/* Mobile menu icon */}
        <button className="md:hidden flex flex-col gap-1.5 p-2">
          {[0,1,2].map(i => (
            <span
              key={i}
              className="block h-px w-5"
              style={{ background: 'var(--gold)', opacity: 1 - i * 0.3 }}
            />
          ))}
        </button>
      </div>
    </nav>
  )
}

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
