import React, { useEffect } from 'react'
import ControlBar from '../components/gpumemoryestimator/ControlBar'
import Navbar from '../components/neuralveil/Navbar'
import LayerInput from '../components/gpumemoryestimator/LayerInput.jsx'
import MemoryChart from '../components/gpumemoryestimator/MemoryChart.jsx'
import GPUTable from '../components/gpumemoryestimator/GPUTable.jsx'
import LayerTable from '../components/gpumemoryestimator/LayerTable.jsx'
import ResultSummary from '../components/gpumemoryestimator/ResultSummary.jsx'
import SweepChart from '../components/gpumemoryestimator/SweepChart.jsx'
import HFImport from '../components/gpumemoryestimator/HfImport.jsx'
import useMemoryStore from '../store/useMemoryStore.js'
import { deserializeFromURL } from '../utils/urlShare.js'
import gpt2 from '../presets/gpt2_small.json'
import '../styles/gpu.css'

export const GPUMemoryEstimator = () => {
  const loadPreset = useMemoryStore((s) => s.loadPreset)

  useEffect(() => {
    const fromURL = deserializeFromURL()
    if (fromURL && fromURL.layers?.length > 0) {
      loadPreset({ ...fromURL.config, layers: fromURL.layers })
    } else {
      loadPreset(gpt2)
    }
  }, [])

  return (
    <div className="scanlines" style={{ minHeight: '100vh', background: 'var(--nf-bg)' }}>

      <header className="app-header">
        <div className="app-logo">
          <span className="logo-neural">Neural</span>
          <span className="logo-forge">veil</span>
          <span className="logo-sep"> // </span>
          <span className="logo-title">GPU Memory Estimator</span>
        </div>
        <div className="app-header-right">
          <div className="app-badge">v2.0</div>
        </div>
      </header>

      {/* Body */}
      <div className="app-body">

        <aside className="app-sidebar">
          <div className="sidebar-top">
            <ControlBar />
          </div>
          <div className="sidebar-divider" />
          <div className="sidebar-hf">
            <HFImport />
          </div>
          <div className="sidebar-divider" />
          <div className="sidebar-layers">
            <LayerInput />
          </div>
        </aside>

        <main className="app-main">

          <section className="main-panel">
            <div className="panel-label" style={{ padding: '10px 16px 0', marginBottom: 0 }}>
              // Memory Analysis
            </div>
            <ResultSummary />
          </section>

          <section className="main-panel">
            <div className="panel-label" style={{ padding: '10px 16px 0', marginBottom: 0 }}>
              // VRAM Breakdown by Layer
            </div>
            <MemoryChart />
          </section>

          {/* Layer Breakdown */}
          <section className="main-panel" style={{ height: '480px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <LayerTable />
          </section>

          <section className="main-panel">
            <SweepChart />
          </section>

          <section className="main-panel">
            <GPUTable />
          </section>
        </main>
      </div>

      <style>{`
        .app-header {
          background: var(--nf-surface);
          border-bottom: 1px solid var(--nf-border2);
          padding: 13px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .app-logo {
          display: flex;
          align-items: baseline;
          gap: 0;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .logo-neural { color: var(--nf-accent); }
        .logo-forge { color: var(--nf-text); }
        .logo-sep { color: var(--nf-muted); font-weight: 400; margin: 0 4px; }
        .logo-title {
          color: var(--nf-muted);
          font-weight: 400;
          font-size: 12px;
          letter-spacing: 0.08em;
        }
        .app-badge {
          font-size: 9px;
          letter-spacing: 0.15em;
          color: var(--nf-muted);
          border: 1px solid var(--nf-border2);
          padding: 3px 10px;
          border-radius: 2px;
          text-transform: uppercase;
        }
        .app-body {
          display: grid;
          grid-template-columns: 280px 1fr;
          height: calc(100vh - 49px);
          overflow: hidden;
        }
        .app-sidebar {
          background: var(--nf-surface);
          border-right: 1px solid var(--nf-border);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .sidebar-top {
          flex-shrink: 0;
          overflow-y: auto;
        }
        .sidebar-hf {
          flex-shrink: 0;
        }
        .sidebar-divider {
          height: 1px;
          background: var(--nf-border);
          flex-shrink: 0;
        }
        .sidebar-layers {
          flex: 1;
          padding: 14px 14px 14px;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .app-main {
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 0;
        }
        .main-panel {
          background: var(--nf-surface);
          border-bottom: 1px solid var(--nf-border);
        }
        .main-panel:last-child { border-bottom: none; }
      `}</style>
    </div>
  )
}