import React from 'react'

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  size: 1.5 + Math.random() * 3,
  delay: Math.random() * 5,
  duration: 3 + Math.random() * 4,
  color: i % 3 === 0 ? '#c9a84c' : i % 3 === 1 ? '#ff5e1a' : '#e8c96a',
  opacity: 0.3 + Math.random() * 0.5,
}))

export default function EmberParticles({ count = 18 }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLES.slice(0, count).map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            opacity: p.opacity,
            animation: `emberFloat ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
