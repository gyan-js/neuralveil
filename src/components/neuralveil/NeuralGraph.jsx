import React, { useEffect, useRef } from 'react'

// Animated neural node graph background
export default function NeuralGraph({ color = '#c9a84c', opacity = 0.25, density = 'normal' }) {
  const nodes = density === 'dense'
    ? [
        { x: 10, y: 15 }, { x: 25, y: 40 }, { x: 45, y: 20 }, { x: 60, y: 55 },
        { x: 75, y: 30 }, { x: 88, y: 65 }, { x: 15, y: 70 }, { x: 35, y: 80 },
        { x: 55, y: 75 }, { x: 70, y: 85 }, { x: 80, y: 10 }, { x: 92, y: 40 },
        { x: 5,  y: 90 }, { x: 50, y: 50 }, { x: 30, y: 25 },
      ]
    : [
        { x: 12, y: 20 }, { x: 35, y: 50 }, { x: 60, y: 25 }, { x: 78, y: 60 },
        { x: 20, y: 75 }, { x: 50, y: 85 }, { x: 85, y: 20 }, { x: 90, y: 75 },
        { x: 45, y: 55 },
      ]

  const edges = density === 'dense'
    ? [
        [0,2],[0,1],[1,6],[2,4],[2,13],[3,5],[3,13],[4,11],[4,10],
        [5,9],[6,7],[7,8],[8,9],[10,11],[11,5],[12,6],[13,14],[14,2],
      ]
    : [
        [0,2],[0,1],[1,4],[2,3],[2,6],[3,7],[4,5],[5,7],[6,7],[2,8],[3,8],
      ]

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      style={{ opacity }}
    >
      <defs>
        <filter id="glow-graph">
          <feGaussianBlur stdDeviation="0.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Edges */}
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke={color}
          strokeWidth="0.15"
          strokeOpacity="0.5"
          strokeDasharray={i % 3 === 0 ? '1 0.5' : undefined}
          className={i % 3 === 0 ? 'dash-path' : undefined}
        />
      ))}

      {/* Active flow line — highlighted path */}
      <polyline
        points={`${nodes[0].x},${nodes[0].y} ${nodes[2].x},${nodes[2].y} ${nodes[6 % nodes.length].x},${nodes[6 % nodes.length].y}`}
        fill="none"
        stroke={color}
        strokeWidth="0.4"
        strokeOpacity="0.9"
        strokeDasharray="2 1"
        filter="url(#glow-graph)"
        className="dash-path"
      />

      {/* Nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle
            cx={n.x} cy={n.y} r="0.8"
            fill={i % 4 === 0 ? 'var(--ember)' : color}
            opacity={i % 4 === 0 ? 1 : 0.6}
            filter="url(#glow-graph)"
            style={{
              animation: `nodePing ${2 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
          <circle
            cx={n.x} cy={n.y} r="1.8"
            fill="none"
            stroke={color}
            strokeWidth="0.1"
            opacity="0.2"
          />
        </g>
      ))}
    </svg>
  )
}
