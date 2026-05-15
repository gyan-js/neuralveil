import React, { useMemo } from 'react'

// Seeded pseudo-random for deterministic layout
function seededRand(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export default function NeuralGraph({
  opacity = 0.08,
  scale = 1,
  animate = true,
  glowColor = 'var(--ember)',
  width = 900,
  height = 700,
  className = '',
}) {
  const rand = useMemo(() => seededRand(42), [])

  const layers = useMemo(() => {
    const r = seededRand(42)
    return [
      // layer positions (x%) and node counts
      { x: 0.08, count: 4 },
      { x: 0.22, count: 6 },
      { x: 0.38, count: 8 },
      { x: 0.54, count: 7 },
      { x: 0.68, count: 5 },
      { x: 0.82, count: 4 },
      { x: 0.95, count: 3 },
    ].map((layer) => ({
      ...layer,
      nodes: Array.from({ length: layer.count }, (_, i) => ({
        x: layer.x * width + (r() - 0.5) * 30,
        y: (height * 0.1) + (i / (layer.count - 1 || 1)) * height * 0.8 + (r() - 0.5) * 20,
        r: 3 + r() * 4,
        pulse: r() > 0.6,
        delay: r() * 4,
      })),
    }))
  }, [width, height])

  const edges = useMemo(() => {
    const result = []
    for (let l = 0; l < layers.length - 1; l++) {
      const fromLayer = layers[l]
      const toLayer = layers[l + 1]
      fromLayer.nodes.forEach((from, fi) => {
        // connect to 2-4 nodes in the next layer
        const connections = Math.floor(2 + seededRand(l * 10 + fi)() * 3)
        for (let c = 0; c < connections; c++) {
          const ti = Math.floor(seededRand(l * 100 + fi * 10 + c)() * toLayer.nodes.length)
          const to = toLayer.nodes[ti]
          if (to) {
            result.push({
              x1: from.x, y1: from.y,
              x2: to.x, y2: to.y,
              delay: seededRand(l * 200 + fi * 20 + c)() * 5,
              duration: 2 + seededRand(l * 300 + fi * 30 + c)() * 3,
              dashLen: 8 + seededRand(l * 400 + fi * 40 + c)() * 12,
            })
          }
        }
      })
    }
    return result
  }, [layers])

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width * scale}
      height={height * scale}
      className={className}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="ng-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Edges */}
      {edges.map((e, i) => (
        <line
          key={`edge-${i}`}
          x1={e.x1} y1={e.y1}
          x2={e.x2} y2={e.y2}
          stroke="var(--ember)"
          strokeWidth="0.5"
          strokeOpacity="0.5"
          strokeDasharray={animate ? `${e.dashLen} ${e.dashLen * 2}` : 'none'}
          style={animate ? {
            animation: `signal-travel ${e.duration}s linear infinite`,
            animationDelay: `${-e.delay}s`,
          } : {}}
        />
      ))}

      {/* Nodes */}
      {layers.flatMap((layer, li) =>
        layer.nodes.map((node, ni) => (
          <circle
            key={`node-${li}-${ni}`}
            cx={node.x}
            cy={node.y}
            r={node.r}
            fill="none"
            stroke={node.pulse ? 'var(--flame)' : 'var(--ember)'}
            strokeWidth={node.pulse ? 1.5 : 0.8}
            filter={node.pulse ? 'url(#ng-glow)' : undefined}
            style={animate && node.pulse ? {
              animation: `pulse-glow ${2.5 + node.delay * 0.3}s ease-in-out infinite`,
              animationDelay: `${node.delay}s`,
            } : {}}
          />
        ))
      )}
    </svg>
  )
}
