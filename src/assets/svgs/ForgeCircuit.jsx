import React, { useMemo } from 'react'

function seededRand(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export default function ForgeCircuit({
  opacity = 0.06,
  scale = 1,
  animate = true,
  glowColor = 'var(--ember)',
  width = 800,
  height = 800,
  className = '',
}) {
  const { traces, dots } = useMemo(() => {
    const rand = seededRand(13)
    const traces = []
    const dots = []

    // Generate angular circuit traces (right-angle paths)
    for (let i = 0; i < 18; i++) {
      const startX = rand() * width
      const startY = rand() * height
      const seg1Len = 40 + rand() * 120
      const seg2Len = 30 + rand() * 100
      const seg3Len = 20 + rand() * 80
      const dir1 = rand() > 0.5 ? 1 : -1
      const axis1 = rand() > 0.5 ? 'h' : 'v'
      const axis2 = axis1 === 'h' ? 'v' : 'h'

      const mid1X = axis1 === 'h' ? startX + dir1 * seg1Len : startX
      const mid1Y = axis1 === 'v' ? startY + dir1 * seg1Len : startY
      const dir2 = rand() > 0.5 ? 1 : -1
      const mid2X = axis2 === 'h' ? mid1X + dir2 * seg2Len : mid1X
      const mid2Y = axis2 === 'v' ? mid1Y + dir2 * seg2Len : mid1Y
      const dir3 = rand() > 0.5 ? 1 : -1
      const endX = axis1 === 'h' ? mid2X + dir3 * seg3Len : mid2X
      const endY = axis1 === 'v' ? mid2Y + dir3 * seg3Len : mid2Y

      const path = `M${startX.toFixed(0)},${startY.toFixed(0)} L${mid1X.toFixed(0)},${mid1Y.toFixed(0)} L${mid2X.toFixed(0)},${mid2Y.toFixed(0)} L${endX.toFixed(0)},${endY.toFixed(0)}`
      const totalLen = seg1Len + seg2Len + seg3Len
      traces.push({
        path,
        len: totalLen,
        delay: rand() * 6,
        duration: 3 + rand() * 4,
        // solder dots at joints
        joints: [
          { x: mid1X, y: mid1Y },
          { x: mid2X, y: mid2Y },
        ],
      })

      dots.push({ x: startX, y: startY, r: 2 + rand() * 2 })
      dots.push({ x: endX, y: endY, r: 2 + rand() * 2 })
    }

    return { traces, dots }
  }, [width, height])

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
        <filter id="fc-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {traces.map((t, i) => (
        <g key={i}>
          <path
            d={t.path}
            stroke="var(--ember)"
            strokeWidth="1"
            fill="none"
            strokeDasharray={animate ? `${t.len} ${t.len}` : 'none'}
            style={animate ? {
              animation: `circuit-travel ${t.duration}s linear infinite`,
              animationDelay: `${-t.delay}s`,
            } : {}}
          />
          {t.joints.map((j, ji) => (
            <circle
              key={ji}
              cx={j.x} cy={j.y}
              r="3"
              fill="var(--ember)"
              opacity="0.8"
            />
          ))}
        </g>
      ))}

      {dots.map((d, i) => (
        <circle
          key={`dot-${i}`}
          cx={d.x} cy={d.y} r={d.r}
          fill="var(--flame)"
          opacity="0.6"
        />
      ))}
    </svg>
  )
}
