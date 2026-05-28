import { useEffect, useRef } from 'react'
import ELK from 'elkjs/lib/elk.bundled.js'

const elk = new ELK()

export const useElkLayout = (rawNodes, rawEdges, onNodesChange) => {
 
  const measuredKey = rawNodes
    .map(n => `${n.id}:${n.measured?.width ?? 0}x${n.measured?.height ?? 0}`)
    .join('|')

  const lastKeyRef = useRef(null)

  useEffect(() => {
    if (!rawNodes.length) return
    const key = `${rawNodes.length}-${rawEdges.length}-${measuredKey}`
    if (key === lastKeyRef.current) return
    lastKeyRef.current = key

    const elkGraph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        'elk.layered.spacing.nodeNodeBetweenLayers': '80',
        'elk.spacing.nodeNode': '50',
        'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
        'elk.edgeRouting': 'ORTHOGONAL',
      },
      children: rawNodes.map(n => ({
        id: n.id,
        width:  n.measured?.width  ?? 240,
        height: n.measured?.height ?? 100,
      })),
      edges: rawEdges.map(e => ({
        id: e.id,
        sources: [e.source],
        targets: [e.target],
      })),
    }

    elk.layout(elkGraph).then(result => {
  
      const changes = result.children
        .map(elkNode => {
          const raw = rawNodes.find(n => n.id === elkNode.id)
          if (!raw) return null
          if (raw.position.x === elkNode.x && raw.position.y === elkNode.y) return null
          return {
            id: elkNode.id,
            type: 'position',
            position: { x: elkNode.x, y: elkNode.y },
          }
        })
        .filter(Boolean)

      if (changes.length > 0) onNodesChange(changes)
    })
  
  }, [rawNodes.length, rawEdges.length, measuredKey])
}