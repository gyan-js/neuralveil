import React, { useEffect, useState } from 'react'
import NeuralGraph from './NeuralGraph.jsx'
import EmberParticles from './EmberParticles.jsx'
import DiagLabel from './DiagLabel.jsx'

export default function Hero() {
  
  const [line, setLine] = useState(0)

 



  return (
    <section
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      style={{ paddingTop: '5rem' }}
    >
      {/* Radial forge glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 60% 50%, rgba(255,94,26,0.07) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 40% 40% at 20% 80%, rgba(201,168,76,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Neural graph background */}
      <div className="absolute inset-0 pointer-events-none">
        <NeuralGraph color="#c9a84c" opacity={0.18} density="dense" />
      </div>

      {/* Ember particles */}
      <EmberParticles count={14} />

      {/* Boot terminal — top-left */}
      <div
        className="absolute top-20 left-6 font-mono-tech z-10 opacity-0"
        style={{
          opacity: 1,
          animation: 'fadeIn 0.5s ease forwards',
        }}
      >
        
      </div>

      {/* Floating diagnostic labels — top right */}
      <div className="absolute top-20 right-6 flex flex-col items-end gap-2 z-10">
        <DiagLabel label="STATUS" value="ONLINE" color="ember" blink />
        <DiagLabel label="ENV" value="RESEARCH" color="dim" />
        <DiagLabel label="BUILD" value="3.0.1-gamma" color="gold" />
      </div>

      {/* MAIN HEADLINE */}
      <div className="relative z-10 px-6 md:px-12 mt-16">
        {/* Small mono pre-label */}
        <div
          className="font-mono-tech mb-4 reveal-left opacity-0-init delay-300"
          style={{ color: 'var(--ember)', fontSize: '0.7rem', letterSpacing: '0.3em' }}
        >
          ◆ SYSTEM IDENTIFIER NV-001 ◆
        </div>

      
        <h1
          className="font-bebas leading-none glitch-text reveal-up opacity-0-init delay-100"
          data-text="THE FORGE WHERE"
          style={{
            fontSize: 'clamp(56px, 12vw, 85px)',
            color: 'var(--text)',
            letterSpacing: '0.02em',
          }}
        >
          THE FORGE WHERE
        </h1>
        <h1
          className="font-bebas leading-none reveal-up opacity-0-init delay-300"
          style={{
            fontSize: 'clamp(56px, 12vw, 85px)',
            color: 'var(--gold)',
            letterSpacing: '0.02em',
            textShadow: '0 0 60px rgba(201,168,76,0.3)',
            marginLeft: 'clamp(1rem, 4vw, 5rem)',
          }}
        >
          MODELS ARE
        </h1>
        <h1
          className="font-bebas leading-none reveal-up opacity-0-init delay-500"
          data-text="UNDERSTOOD"
          style={{
            fontSize: 'clamp(56px, 12vw, 85px)',
            color: 'var(--ember)',
            letterSpacing: '0.02em',
            textShadow: '0 0 60px rgba(255,94,26,0.4)',
            marginLeft: 'clamp(2rem, 8vw, 12rem)',
          }}
        >
          UNDERSTOOD
        </h1>

        {/* Subheadline */}
        <p
          className="mt-8 max-w-xl font-body reveal-up opacity-0-init delay-700"
          style={{
            color: 'var(--text-dim)',
            fontSize: '0.95rem',
            lineHeight: '1.8',
            marginLeft: 'clamp(0rem, 2vw, 2rem)',
          }}
        >
          NeuralVeil is a research-grade ML developer toolkit built for engineers who
          think at the systems level. Two powerful tools. One unified suite.{' '}
          <span style={{ color: 'var(--gold)' }}>Dropping end of May.</span>
        </p>

        {/* CTAs */}
        <div
          className="flex flex-wrap gap-4 mt-10 reveal-up opacity-0-init delay-1000"
          style={{ marginLeft: 'clamp(0rem, 2vw, 2rem)' }}
        >
          <a
            href="#launch"
            className="font-mono-tech text-sm px-8 py-3 border transition-all duration-300 relative overflow-hidden group"
            style={{
              borderColor: 'var(--ember)',
              color: 'var(--ember)',
              letterSpacing: '0.15em',
            }}
          >
            <span className="relative z-10 group-hover:text-bg transition-colors duration-300">GET NOTIFIED</span>
            <span
              className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
              style={{ background: 'var(--ember)' }}
            />
          </a>
          {/**<a
            href="https://github.com/gyan-js"
            target="_blank"
            rel="noreferrer"
            className="font-mono-tech text-sm px-8 py-3 border transition-all duration-300"
            style={{
              borderColor: 'rgba(201,168,76,0.3)',
              color: 'var(--text-dim)',
              letterSpacing: '0.15em',
            }}
          >
            VIEW SOURCE
          </a>**/}
        </div>

        {/* Floating stats row */}
        <div
          className="flex flex-wrap gap-6 mt-14 reveal-up opacity-0-init delay-1200"
          style={{ marginLeft: 'clamp(0rem, 2vw, 2rem)' }}
        >
          {[
            { n: '2',      label: 'CORE TOOLS' },
            { n: '∞',      label: 'MODEL SIZES' },
            { n: '< 1ms',  label: 'TRACE LATENCY' },
            { n: 'GYAN SHRESTH',   label: 'BUILT BY' },
          ].map(({ n, label }) => (
            <div key={label} className="flex flex-col gap-1">
              <span
                className="font-bebas"
                style={{
                  fontSize: '2.2rem',
                  color: 'var(--gold)',
                  lineHeight: 1,
                  textShadow: '0 0 20px rgba(201,168,76,0.4)',
                }}
              >
                {n}
              </span>
              <span
                className="font-mono-tech"
                style={{ fontSize: '0.55rem', color: 'var(--text-dim)', letterSpacing: '0.2em' }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom coordinate bar */}
      <div
        className="absolute bottom-6 left-6 right-6 flex justify-between items-center font-mono-tech opacity-30"
        style={{ fontSize: '0.55rem', color: 'var(--text-dim)', letterSpacing: '0.15em' }}
      >
        <span>NV-FORGE::SECTOR_01 // X:000 Y:000</span>
        <span className="hidden md:block">VIEWPORT: {typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : '—'}</span>
        <span>RENDER: NOMINAL</span>
      </div>

      {/* Vertical right-edge label */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 font-mono-tech hidden lg:flex flex-col items-center gap-0 z-10"
        style={{ writingMode: 'vertical-rl', color: 'rgba(201,168,76,0.2)', fontSize: '0.55rem', letterSpacing: '0.2em' }}
      >
        NEURALVEIL / HERO_SECTOR / INITIALIZED
      </div>
    </section>
  )
}
