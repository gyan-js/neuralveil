import React from 'react'
import { useInView } from '../hooks/useInView.js'
import NeuralGraph from './NeuralGraph.jsx'
import DiagLabel from './DiagLabel.jsx'

export default function About() {
  const [ref, inView] = useInView()

  return (
    <section ref={ref} id="about" className="relative min-h-screen flex items-center overflow-hidden py-24">
      {/* BG tint */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'var(--bg2)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 70% at 80% 40%, rgba(201,168,76,0.05) 0%, transparent 70%)',
        }}
      />

      {/* Right-side neural graph */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none">
        <NeuralGraph color="#c9a84c" opacity={0.2} />
      </div>

      {/* Decorative vertical line */}
      <div
        className="absolute left-1/3 top-0 bottom-0 w-px pointer-events-none hidden lg:block"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(201,168,76,0.15) 30%, rgba(201,168,76,0.15) 70%, transparent)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
        <div className="grid lg:grid-cols-5 gap-12 items-center">

          {/* Left col — heading */}
          <div className="lg:col-span-2">
            <div
              className="font-mono-tech mb-4"
              style={{
                color: 'var(--gold)',
                fontSize: '0.6rem',
                letterSpacing: '0.25em',
                opacity: inView ? 1 : 0,
                transform: inView ? 'none' : 'translateX(-20px)',
                transition: 'all 0.6s ease',
              }}
            >
              ◆ ABOUT THE SUITE
            </div>

            <h2
              className="font-bebas leading-none"
              style={{
                fontSize: 'clamp(3rem, 6vw, 6rem)',
                color: 'var(--text)',
                letterSpacing: '0.02em',
                opacity: inView ? 1 : 0,
                transform: inView ? 'none' : 'translateX(-30px)',
                transition: 'all 0.8s ease 0.1s',
              }}
            >
              CLASSIFIED
            </h2>
            <h2
              className="font-bebas leading-none"
              style={{
                fontSize: 'clamp(3rem, 6vw, 6rem)',
                color: 'var(--gold)',
                letterSpacing: '0.02em',
                textShadow: '0 0 40px rgba(201,168,76,0.3)',
                marginLeft: '1.5rem',
                opacity: inView ? 1 : 0,
                transform: inView ? 'none' : 'translateX(-30px)',
                transition: 'all 0.8s ease 0.2s',
              }}
            >
              BRIEFING
            </h2>

            {/* Vertical decorative line from heading */}
            <div
              className="mt-6 ml-4"
              style={{
                width: '2px',
                height: '60px',
                background: 'linear-gradient(to bottom, rgba(201,168,76,0.6), transparent)',
                opacity: inView ? 1 : 0,
                transition: 'all 0.6s ease 0.5s',
              }}
            />

            <div
              className="mt-4 space-y-2"
              style={{
                opacity: inView ? 1 : 0,
                transition: 'all 0.6s ease 0.6s',
              }}
            >
              <DiagLabel label="ORIGIN" value="SOLO DEV" color="gold" />
              <br />
              <DiagLabel label="CLASS" value="RESEARCH-GRADE" color="ember" />
              <br />
              <DiagLabel label="TARGET" value="ML ENGINEERS" color="dim" />
            </div>
          </div>

          {/* Right col — content */}
          <div
            className="lg:col-span-3 relative"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? 'none' : 'translateX(30px)',
              transition: 'all 0.8s ease 0.3s',
            }}
          >
            {/* Decorative corner bracket */}
            <div
              className="absolute -top-4 -left-4 w-8 h-8 border-t border-l"
              style={{ borderColor: 'rgba(201,168,76,0.4)' }}
            />
            <div
              className="absolute -bottom-4 -right-4 w-8 h-8 border-b border-r"
              style={{ borderColor: 'rgba(201,168,76,0.4)' }}
            />

            <p
              className="font-body leading-relaxed"
              style={{ color: 'var(--text-dim)', fontSize: '1rem', lineHeight: 2 }}
            >
              NeuralVeil is a suite of research-grade ML developer tools designed to give engineers{' '}
              <span style={{ color: 'var(--text)' }}>deep visibility into model architecture, memory behavior, and computational structure.</span>
              {' '}Built from the ground up by a solo developer, it targets the gap between toy tutorials and{' '}
              <span style={{ color: 'var(--gold)' }}>what real AI labs actually need.</span>
            </p>

            {/* Technical diagram panel */}
            <div
              className="mt-10 border p-6 relative"
              style={{
                borderColor: 'rgba(201,168,76,0.12)',
                background: 'rgba(5,5,8,0.6)',
              }}
            >
              <div
                className="font-mono-tech mb-4"
                style={{ color: 'var(--text-dim)', fontSize: '0.6rem', letterSpacing: '0.2em' }}
              >
                ARCHITECTURE OVERVIEW
              </div>

              {/* Inline arch diagram */}
              <svg viewBox="0 0 500 80" className="w-full" style={{ height: '80px' }}>
                {/* Boxes */}
                {[
                  { x: 10, label: 'MODEL INPUT', color: '#7a7870' },
                  { x: 130, label: 'TENSOR TRACER', color: '#ff5e1a' },
                  { x: 250, label: 'NEURALVEIL', color: '#c9a84c' },
                  { x: 370, label: 'GPU ESTIMATOR', color: '#00e5ff' },
                ].map(({ x, label, color }, i) => (
                  <g key={i}>
                    <rect x={x} y={20} width={100} height={36} rx="2"
                      fill="rgba(5,5,8,0.8)" stroke={color} strokeWidth="0.8" strokeOpacity="0.6"
                    />
                    <text x={x + 50} y={42} textAnchor="middle"
                      fontFamily="'Share Tech Mono', monospace" fontSize="6.5"
                      fill={color} letterSpacing="0.5"
                    >
                      {label}
                    </text>
                  </g>
                ))}
                {/* Arrows */}
                {[110, 230, 350].map((x, i) => (
                  <g key={i}>
                    <line x1={x} y1={38} x2={x + 20} y2={38}
                      stroke="#c9a84c" strokeWidth="0.8" strokeOpacity="0.5"
                      strokeDasharray="3 1.5" className="dash-path"
                    />
                    <polygon points={`${x + 20},35 ${x + 26},38 ${x + 20},41`}
                      fill="#c9a84c" opacity="0.5"
                    />
                  </g>
                ))}
              </svg>
            </div>

            {/* Feature highlights */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              {[
                { label: 'Shape Tracing',      desc: 'Tensor dim propagation at every layer' },
                { label: 'Memory Estimation',  desc: 'Precise VRAM footprint computation' },
                { label: 'Compute Graph',       desc: 'Full forward pass architecture map' },
                { label: 'Error Highlighting',  desc: 'Pin-point shape mismatches instantly' },
              ].map(({ label, desc }) => (
                <div
                  key={label}
                  className="border p-3 group hover:border-gold-dim transition-all duration-300"
                  style={{ borderColor: 'rgba(201,168,76,0.08)', background: 'rgba(14,14,22,0.5)' }}
                >
                  <div
                    className="font-mono-tech text-xs mb-1 group-hover:text-gold transition-colors duration-200"
                    style={{ color: 'var(--text-dim)', letterSpacing: '0.1em', fontSize: '0.65rem' }}
                  >
                    {label}
                  </div>
                  <div className="font-body" style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                    {desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
