import {
  ReactFlow, Background, Controls, MiniMap,
  useReactFlow, Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useRef } from 'react'
import { useGraphStore } from '../store/useGraphStore.js'
import LayerNode from './nodes/LayerNode.jsx'
import InputNode from './nodes/InputNode.jsx'
import MergeNode from './nodes/MergeNode.jsx'
import ShapeEdge from './edges/ShapeEdge.jsx'
import { LAYER_DEFAULTS } from '../constants/layerDefaults.js'
import { useElkLayout } from '../utils/useElkLayout.js'
const nodeTypes = {
  layerNode: LayerNode,
  inputNode: InputNode,
  mergeNode: MergeNode,
}
const edgeTypes = {
  shapeEdge: ShapeEdge,
}


const LEGEND_ITEMS = [
  { color: '#00E5FF', label: 'Idle/Selected/No Error',         sub: 'Clean state of the node graphs.'       },
  { color: '#FF6B35', label: 'Major Error',        sub: 'Shape mismatch, Dimension mismatch .etc'     },
  { color: '#FFE155', label: 'Minor Error',      sub: 'No connected input or missing a input layer connection.'      },
  //{ color: '#a855f7', label: 'CLI verified', sub: 'pytorch-confirmed'  },
]

function NodeLegend() {
  return (
    <div style={{
      background: '#0D1526',
      border: '1px solid rgba(0,229,255,0.12)',
      borderRadius: 10,
      padding: '10px 14px',
      width: 170,
      fontFamily: "\'Syne\', sans-serif",
    }}>
      <div style={{
        fontSize: 9, letterSpacing: '0.12em',
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase', marginBottom: 10,
      }}>
        NODE LEGENEDS
      </div>
      {LEGEND_ITEMS.map(({ color, label, sub }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
          <div style={{
            width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
            background: color,
            boxShadow: `0 0 6px ${color}`,
          }} />
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{label}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: "\'JetBrains Mono\', monospace" }}>{sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function GraphCanvas() {
  const rawNodes = useGraphStore(s => s.nodes)
  const edges = useGraphStore(s => s.edges)
  const onNodesChange = useGraphStore(s => s.onNodesChange)
  useElkLayout(rawNodes, edges, onNodesChange) 
  const onEdgesChange = useGraphStore(s => s.onEdgesChange)
  const onConnect = useGraphStore(s => s.onConnect)
  const addNode = useGraphStore(s => s.addNode)
  const deselectNode = useGraphStore(s => s.deselectNode)
  const { screenToFlowPosition } = useReactFlow()
  const canvasRef = useRef(null)

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    const layerType = e.dataTransfer.getData('application/reactflow')
    if (!layerType || !LAYER_DEFAULTS[layerType]) return

    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    addNode(layerType, position)
  }, [screenToFlowPosition, addNode])

  const onPaneClick = useCallback(() => {
    deselectNode()
  }, [deselectNode])

  return (
    <div
      ref={canvasRef}
      style={{ flex: 1, position: 'relative' }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div
        className="dot-grid-bg"
        style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      />
      <ReactFlow
        nodes={rawNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{ type: 'shapeEdge' }}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent', position: 'relative', zIndex: 1 }}
      >
        <Background color="transparent" />

        <Controls position="bottom-left" showInteractive={false} />

        <MiniMap
          position="bottom-right"
          nodeColor={(n) => {
            const lt = n.data?.layerType ?? n.type
            if (lt === 'Input')  return '#39FF14'
            if (lt === 'Merge')  return '#F59E0B'
            if (lt === 'Conv1D') return '#00B8D4'
            if (lt === 'Conv3D') return '#0097A7'
            return '#00E5FF'
          }}
          maskColor="rgba(0,0,0,0.6)"
          style={{ background: '#0D1526', border: '1px solid rgba(0,229,255,0.08)' }}
        />
        <Panel position="top-left">
          <NodeLegend />
        </Panel>
      </ReactFlow>
    </div>
  )
}