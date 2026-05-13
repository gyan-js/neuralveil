import React from 'react'

export default function SectionDivider({ variant = 'gold' }) {
  const color = variant === 'ember' ? '#ff5e1a' : variant === 'cyan' ? '#00e5ff' : '#c9a84c'

  return (
    <div className="relative w-full h-20 overflow-hidden flex items-center">
      <svg
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <filter id={`divider-glow-${variant}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main horizontal rule */}
        <line
          x1="0" y1="30" x2="1200" y2="30"
          stroke={color}
          strokeWidth="0.5"
          strokeOpacity="0.2"
        />

        {/* Dashed path overlay */}
        <line
          x1="0" y1="30" x2="1200" y2="30"
          stroke={color}
          strokeWidth="1"
          strokeOpacity="0.6"
          strokeDasharray="4 200"
          className="dash-path"
          filter={`url(#divider-glow-${variant})`}
        />

        {/* Decorative nodes */}
        {[100, 300, 600, 900, 1100].map((x, i) => (
          <g key={i}>
            <circle
              cx={x} cy={30} r="2"
              fill={color}
              opacity={0.4 + (i % 2) * 0.3}
              style={{ animation: `nodePing ${2 + i}s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }}
            />
            <circle
              cx={x} cy={30} r="5"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              opacity="0.15"
            />
            {/* Tick lines */}
            <line x1={x} y1="22" x2={x} y2="38" stroke={color} strokeWidth="0.5" opacity="0.2" />
          </g>
        ))}

        {/* Diagonal accent lines */}
        <line x1="0" y1="0" x2="100" y2="30" stroke={color} strokeWidth="0.3" strokeOpacity="0.1" />
        <line x1="1200" y1="60" x2="1100" y2="30" stroke={color} strokeWidth="0.3" strokeOpacity="0.1" />

        {/* Floating label */}
        <text
          x="600" y="20"
          textAnchor="middle"
          fontFamily="'Share Tech Mono', monospace"
          fontSize="6"
          fill={color}
          opacity="0.4"
          letterSpacing="3"
        >
          ◆ SYSTEM SUBSECTION ◆
        </text>
      </svg>
    </div>
  )
}
