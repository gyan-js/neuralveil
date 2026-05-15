import React, { useMemo } from 'react'

function seededRand(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function buildBranch(x, y, angle, length, depth, rand, paths) {
  if (depth === 0 || length < 4) return
  const endX = x + Math.cos(angle) * length
  const endY = y + Math.sin(angle) * length
  paths.push(`M${x.toFixed(1)},${y.toFixed(1)} L${endX.toFixed(1)},${endY.toFixed(1)}`)
  const branches = depth > 2 ? 3 : 2
  for (let i = 0; i < branches; i++) {
    const spread = (rand() - 0.5) * 1.2
    buildBranch(endX, endY, angle + spread, length * (0.55 + rand() * 0.2), depth - 1, rand, paths)
  }
}

export default function DendriteField({
  opacity = 0.06,
  scale = 1,
  animate = false,
  glowColor = 'var(--ash)',
  width = 600,
  height = 800,
  className = '',
}) {
  const paths = useMemo(() => {
    const rand = seededRand(77)
    const all = []
    const roots = [
      { x: 60, y: 200, angle: Math.PI * 0.3, length: 80 },
      { x: 200, y: 500, angle: Math.PI * 0.15, length: 100 },
      { x: 100, y: 700, angle: Math.PI * 0.4, length: 70 },
      { x: 350, y: 150, angle: Math.PI * 0.6, length: 90 },
      { x: 450, y: 400, angle: Math.PI * 0.25, length: 75 },
      { x: 30, y: 400, angle: -Math.PI * 0.2, length: 85 },
    ]
    roots.forEach(root => {
      buildBranch(root.x, root.y, root.angle, root.length, 6, rand, all)
    })
    return all
  }, [])

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width * scale}
      height={height * scale}
      className={className}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke="var(--ash)"
          strokeWidth="0.8"
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}
