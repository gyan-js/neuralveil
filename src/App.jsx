// App.jsx — Root layout
import { ReactFlowProvider } from '@xyflow/react'
import TopBar from './components/TopBar.jsx'
import LayerPalette from './components/LayerPalette.jsx'
import GraphCanvas from './components/GraphCanvas.jsx'
import Inspector from './components/Inspector.jsx'
import StatusBar from './components/StatusBar.jsx'

export default function App() {
  return (
    <ReactFlowProvider>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        background: '#080C14',
        overflow: 'hidden',
      }}>
        <TopBar />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          <LayerPalette />
          <GraphCanvas />
          <Inspector />
        </div>
        <StatusBar />
      </div>
    </ReactFlowProvider>
  )
}
