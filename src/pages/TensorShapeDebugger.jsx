import { useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import TopBar from '../components/TopBar.jsx'
import LayerPalette from '../components/LayerPalette.jsx'
import GraphCanvas from '../components/GraphCanvas.jsx'
import Inspector from '../components/Inspector.jsx'
import StatusBar from '../components/StatusBar.jsx'
import CodeImportPanel from '../components/CodeImportPanel.jsx'
import ExecutionPanel from '../components/ExecutionPanel.jsx'
import OpsExpandPanel from '../components/OpsExpandPanel.jsx'
import BackendBadge from '../components/BackendBadge.jsx'
import LayerGroupNode from '../components/nodes/LayerGroupNode.jsx'

export const EXTRA_NODE_TYPES = {
  layerGroupNode: LayerGroupNode,
}

export const TensorShapeDebugger = () => {
  const [executionPanelOpen, setExecutionPanelOpen] = useState(false)

  return (
    <ReactFlowProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        <TopBar
          onOpenExecutionPanel={() => setExecutionPanelOpen(true)}
          rightSlot={<BackendBadge />}
        />

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <LayerPalette />

          <GraphCanvas extraNodeTypes={EXTRA_NODE_TYPES} />

          <Inspector />
        </div>

        <StatusBar />
      </div>

      {/* ── Panels / overlays ──────────────────────────── */}
      <CodeImportPanel />

      <ExecutionPanel
        isOpen={executionPanelOpen}
        onClose={() => setExecutionPanelOpen(false)}
      />

      <OpsExpandPanel />
    </ReactFlowProvider>
  )
}