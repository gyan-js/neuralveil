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

const nodeTypes = {
  layerNode: LayerNode,
  inputNode: InputNode,
  mergeNode: MergeNode,
}
const edgeTypes = {
  shapeEdge: ShapeEdge,
}

export default function GraphCanvas() {
  const nodes = useGraphStore(s => s.nodes)
  const edges = useGraphStore(s => s.edges)
  const onNodesChange = useGraphStore(s => s.onNodesChange)
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
      <ReactFlow
        nodes={nodes}
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
        style={{ background: 'transparent' }}
      >
        
        <div
          className="dot-grid-bg"
          style={{ position: 'absolute', inset: 0, zIndex: -1 }}
        />
        <Background color="transparent" />

        <Controls position="bottom-left" showInteractive={false} />

        <MiniMap
          position="bottom-right"
          nodeColor={(n) => {
            if (n.data?.layerType === 'Input') return '#39FF14'
            if (n.data?.layerType === 'Merge') return '#F59E0B'
            return '#00E5FF'
          }}
          maskColor="rgba(0,0,0,0.6)"
          style={{ background: '#0D1526', border: '1px solid rgba(0,229,255,0.08)' }}
        />
      </ReactFlow>
    </div>
  )
}