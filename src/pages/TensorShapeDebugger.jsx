import { useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import TopBar from '../components/TopBar.jsx'
import LayerPalette from '../components/LayerPalette.jsx'
import GraphCanvas from '../components/GraphCanvas.jsx'
import Inspector from '../components/Inspector.jsx'
import StatusBar from '../components/StatusBar.jsx'
import CodeImportPanel from '../components/CodeImportPanel.jsx'
import ExecutionPanel from '../components/ExecutionPanel.jsx'

export const TensorShapeDebugger = () => {
  const [executionPanelOpen, setExecutionPanelOpen] = useState(false)

  return (
    <ReactFlowProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <TopBar onOpenExecutionPanel={() => setExecutionPanelOpen(true)} />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <LayerPalette />
          <GraphCanvas />
          <Inspector />
        </div>
        <StatusBar />
      </div>

      <CodeImportPanel />
      <ExecutionPanel
        isOpen={executionPanelOpen}
        onClose={() => setExecutionPanelOpen(false)}
      />
    </ReactFlowProvider>
  )
}