
import { ReactFlowProvider } from '@xyflow/react'
import TopBar from '../components/TopBar.jsx'
import LayerPalette from '../components/LayerPalette.jsx'
import GraphCanvas from '../components/GraphCanvas.jsx'
import Inspector from '../components/Inspector.jsx'
import StatusBar from '../components/StatusBar.jsx'
import CodeImportPanel from '../components/CodeImportPanel.jsx'   // ← NEW

export const TensorShapeDebugger = () => {
  return (
    <ReactFlowProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <TopBar />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <LayerPalette />
          <GraphCanvas />
          <Inspector />
        </div>
        <StatusBar />
      </div>
      <CodeImportPanel />                                  
    </ReactFlowProvider>
  )
}