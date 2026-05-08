import { getBezierPath, EdgeLabelRenderer } from '@xyflow/react'
import { useGraphStore } from '../../store/useGraphStore.js'
import { formatShape } from '../../engine/shapeEngine.js'
import { useEffect, useRef, useState } from 'react'

export default function ShapeEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  source, target,
}) {
  const shapeResults = useGraphStore(s => s.shapeResults)
  const format = useGraphStore(s => s.format)
  const [animClass, setAnimClass] = useState('')
  const prevFormat = useRef(format)

 
  const sourceResult = shapeResults[source]
  const edgeShape = sourceResult?.outputShape ?? null
  const hasError = !edgeShape || !!sourceResult?.error

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
  })


  useEffect(() => {
    if (prevFormat.current !== format) {
      setAnimClass('shape-flip')
      const t = setTimeout(() => setAnimClass(''), 400)
      prevFormat.current = format
      return () => clearTimeout(t)
    }
  }, [format])

  const strokeColor = hasError ? '#FF6B35' : '#00E5FF'
  const strokeOpacity = hasError ? 0.8 : 0.6

  return (
    <>
      {/* Shadow/glow path */}
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={6}
        strokeOpacity={0.07}
      />
      {/* Main animated path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeOpacity={strokeOpacity}
        strokeDasharray={hasError ? '5 3' : '8 4'}
        className={hasError ? 'edge-error' : 'edge-flow'}
        style={{ transition: 'stroke 0.3s ease' }}
      />

      {/* Shape badge label */}
      <EdgeLabelRenderer>
        <div
          className={`nodrag nopan ${animClass}`}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div style={{
            background: '#0D1526',
            border: `1px solid ${hasError ? '#FF6B35' : '#00E5FF'}`,
            borderRadius: '4px',
            padding: '2px 8px',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '10px',
            color: hasError ? '#FF6B35' : '#00E5FF',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            boxShadow: hasError
              ? '0 0 8px rgba(255,107,53,0.3)'
              : '0 0 8px rgba(0,229,255,0.2)',
            opacity: hasError ? 0.9 : 1,
          }}>
            {edgeShape ? formatShape(edgeShape, format) : '???'}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
