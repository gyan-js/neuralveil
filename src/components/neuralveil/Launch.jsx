import React, { useState } from 'react'
import { useInView } from '../hooks/useInView.js'
import EmberParticles from './EmberParticles.jsx'
import DiagLabel from './DiagLabel.jsx'

export default function Launch() {
  const [ref, inView] = useInView()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email.trim()) {
      setSubmitted(true)
    }
  }

  return (
    <section
      ref={ref}
      id="launch"
      className="relative overflow-hidden py-32 min-h-screen flex items-center"
    >
      {/* BG layers */}
      <div className="absolute inset-0" style={{ background: 'var(--bg)' }} />
      <div
        className="absolute inset-0 pointer-events-none animate-wave"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,94,26,0.08) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 40% 40% at 50% 50%, rgba(201,168,76,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Animated concentric rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[200, 350, 500, 650, 800].map((r, i) => (
          <div
            key={i}
            className="absolute rounded-full border"
            style={{
              width: r,
              height: r,
              borderColor: `rgba(201,168,76,${0.08 - i * 0.01})`,
              animation: `wave ${4 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Scanline sweep */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity: 0.04 }}
      >
        <div
          className="absolute w-full h-1"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(201,168,76,0.8), transparent)',
            animation: 'scanline 6s linear infinite',
          }}
        />
      </div>

      <EmberParticles count={12} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center w-full">
        {/* Status ring */}
        <div
          className="flex justify-center mb-8"
          style={{
            opacity: inView ? 1 : 0,
            transition: 'all 0.5s ease',
          }}
        >
          <div
            className="flex items-center gap-3 px-5 py-2 border rounded-full font-mono-tech"
            style={{
              borderColor: 'rgba(201,168,76,0.3)',
              background: 'rgba(5,5,8,0.8)',
              fontSize: '0.65rem',
              letterSpacing: '0.2em',
              color: 'var(--gold)',
              boxShadow: '0 0 30px rgba(201,168,76,0.15)',
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--ember)' }} />
            SYSTEM CHARGING — ETA: END OF MAY
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--ember)' }} />
          </div>
        </div>

        {/* Giant heading */}
        <h2
          className="font-bebas leading-none"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 9rem)',
            color: 'var(--text)',
            letterSpacing: '0.02em',
            opacity: inView ? 1 : 0,
            transform: inView ? 'none' : 'translateY(30px)',
            transition: 'all 0.8s ease 0.1s',
          }}
        >
          NEURALVEIL IS
        </h2>
        <h2
          className="font-bebas leading-none"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 9rem)',
            color: 'var(--gold)',
            textShadow: '0 0 80px rgba(201,168,76,0.5)',
            letterSpacing: '0.02em',
            opacity: inView ? 1 : 0,
            transform: inView ? 'none' : 'translateY(30px)',
            transition: 'all 0.8s ease 0.2s',
          }}
        >
          ALMOST READY
        </h2>

        <p
          className="mt-8 font-body max-w-xl mx-auto"
          style={{
            color: 'var(--text-dim)',
            lineHeight: 2,
            opacity: inView ? 1 : 0,
            transform: inView ? 'none' : 'translateY(20px)',
            transition: 'all 0.6s ease 0.4s',
          }}
        >
          Two research-grade tools. One unified interface. Built by a 12th passout upcoming undergrad who got tired of guessing.{' '}
          <span style={{ color: 'var(--gold)' }}>Be first in when the forge opens.</span>
        </p>

        {/* Email form */}
        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
            style={{
              opacity: inView ? 1 : 0,
              transition: 'all 0.6s ease 0.6s',
            }}
          >
            <div className="relative flex-1 w-full">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="engineer@lab.ai"
                required
                className="w-full font-mono-tech text-sm px-4 py-3 border outline-none transition-all duration-300"
                style={{
                  background: 'rgba(5,5,8,0.8)',
                  borderColor: 'rgba(201,168,76,0.2)',
                  color: 'var(--text)',
                  letterSpacing: '0.05em',
                  caretColor: 'var(--gold)',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(201,168,76,0.5)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(201,168,76,0.2)' }}
              />
            </div>
            <button
              type="submit"
              className="font-mono-tech text-sm px-7 py-3 border transition-all duration-300 relative overflow-hidden group whitespace-nowrap"
              style={{
                borderColor: 'var(--gold)',
                color: 'var(--gold)',
                letterSpacing: '0.15em',
                background: 'transparent',
              }}
            >
              <span className="relative z-10 group-hover:text-bg transition-colors duration-300">
                INITIALIZE
              </span>
              <span
                className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                style={{ background: 'var(--gold)' }}
              />
            </button>
          </form>
        ) : (
          <div
            className="mt-12 font-mono-tech text-sm px-8 py-4 border mx-auto inline-flex items-center gap-3"
            style={{
              borderColor: 'rgba(201,168,76,0.4)',
              color: 'var(--gold)',
              letterSpacing: '0.15em',
              background: 'rgba(201,168,76,0.05)',
              boxShadow: '0 0 40px rgba(201,168,76,0.15)',
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--gold)' }} />
            SIGNAL RECEIVED — FORGE WILL CONTACT
          </div>
        )}

        {/* Floating diagnostics */}
        <div
          className="mt-12 flex flex-wrap justify-center gap-4"
          style={{
            opacity: inView ? 1 : 0,
            transition: 'all 0.6s ease 0.8s',
          }}
        >
          <DiagLabel label="TOOLS" value="2 READY" color="gold" />
          <DiagLabel label="ACCESS" value="FREE / APACHE 2.0" color="dim" />
          <DiagLabel label="RELEASE" value="MAY 2026" color="ember" blink />
        </div>
      </div>
    </section>
  )
}
