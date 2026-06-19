import {
  ReactFlow, Background, Controls, MiniMap,
  useReactFlow, Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useRef, useEffect } from 'react'
import { useGraphStore } from '../store/useGraphStore.js'
import LayerNode from './nodes/LayerNode.jsx'
import InputNode from './nodes/InputNode.jsx'
import MergeNode from './nodes/MergeNode.jsx'
import ShapeEdge from './edges/ShapeEdge.jsx'
import { LAYER_DEFAULTS } from '../constants/layerDefaults.js'
import { useElkLayout } from '../utils/useElkLayout.js'
import DiffSummary from './DiffSummary.jsx'
import LayerGroupNode from './nodes/LayerGroupNode.jsx'

const nodeTypes = {
  layerNode: LayerNode,
  inputNode: InputNode,
  mergeNode: MergeNode,
  layerGroupNode: LayerGroupNode,
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

function UndoRedoButtons({ onUndo, onRedo, canUndo, canRedo }) {
  const btnStyle = (disabled) => ({
    background: disabled ? 'rgba(13,21,38,0.4)' : '#0D1526',
    border: `1px solid ${disabled ? 'rgba(0,229,255,0.08)' : 'rgba(0,229,255,0.25)'}`,
    borderRadius: 7,
    color: disabled ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.75)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    transition: 'border-color 0.15s, color 0.15s',
    fontFamily: "'Syne', sans-serif",
  })

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button
        style={btnStyle(!canUndo)}
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        ↩
      </button>
      <button
        style={btnStyle(!canRedo)}
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
      >
        ↪
      </button>
    </div>
  )
}

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
  const undo = useGraphStore(s => s.undo)
  const redo = useGraphStore(s => s.redo)
  const canUndo = useGraphStore(s => s.canUndo)
  const canRedo = useGraphStore(s => s.canRedo)

  const diffMode         = useGraphStore(s => s.diffMode)
  const diffDeletedNodes = useGraphStore(s => s.diffDeletedNodes)
  const diffDeletedEdges = useGraphStore(s => s.diffDeletedEdges)
  const diffNodeStateMap = useGraphStore(s => s.diffNodeStateMap)

 
  const displayNodes = useCallback(() => {
    if (!diffMode) return rawNodes
  
    const ghostNodes = diffDeletedNodes.map(n => ({
      ...n,
      draggable: false,
      selectable: false,
      deletable: false,
    }))
    return [...rawNodes, ...ghostNodes]
  }, [rawNodes, diffMode, diffDeletedNodes])

  const displayEdges = useCallback(() => {
    if (!diffMode) return edges
    const ghostEdges = diffDeletedEdges.map(e => ({
      ...e,
      type: 'shapeEdge',
    }))
    return [...edges, ...ghostEdges]
  }, [edges, diffMode, diffDeletedEdges])
  const { screenToFlowPosition } = useReactFlow()
  const canvasRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if (
        (e.ctrlKey || e.metaKey) && e.key === 'y' ||
        (e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey
      ) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  const onDragOver = useCallback((e) => {
    if (diffMode) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [diffMode])

  const onDrop = useCallback((e) => {
    if (diffMode) return
    e.preventDefault()
    const layerType = e.dataTransfer.getData('application/reactflow')
    if (!layerType || !LAYER_DEFAULTS[layerType]) return

    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    addNode(layerType, position)
  }, [screenToFlowPosition, addNode, diffMode])

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
        nodes={displayNodes()}
        edges={displayEdges()}
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
            if (lt === 'Input')  return '#00E5FF'
            if (lt === 'Merge')  return '#F59E0B'
            if (lt === 'Conv1D') return '#00B8D4'
            if (lt === 'Conv3D') return '#0097A7'
            return '#39FF14'
          }}
          maskColor="rgba(0,0,0,0.6)"
          style={{ background: '#0D1526', border: '1px solid rgba(0,229,255,0.08)' }}
        />
        <Panel position="top-left">
          <NodeLegend />
        </Panel>
        <Panel position="top-right">
          <UndoRedoButtons
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo && !diffMode}
            canRedo={canRedo && !diffMode}
          />
        </Panel>
      </ReactFlow>


      {diffMode && <DiffSummary />}


      {diffMode && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'rgba(8,15,30,0.15)',
          pointerEvents: 'none',
          borderTop: '2px solid rgba(0,229,255,0.15)',
        }} />
      )}
    </div>
  )
}