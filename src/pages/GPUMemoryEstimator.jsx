import React, { useEffect, useState, useRef } from 'react'
import ControlBar from '../components/gpumemoryestimator/ControlBar'
import LayerInput from '../components/gpumemoryestimator/LayerInput.jsx'
import MemoryChart from '../components/gpumemoryestimator/MemoryChart.jsx'
import GPUTable from '../components/gpumemoryestimator/GPUTable.jsx'
import LayerTable from '../components/gpumemoryestimator/LayerTable.jsx'
import ResultSummary from '../components/gpumemoryestimator/ResultSummary.jsx'
import SweepChart from '../components/gpumemoryestimator/SweepChart.jsx'
import HFImport from '../components/gpumemoryestimator/HfImport.jsx'
import CostEstimator from '../components/gpumemoryestimator/CostEstimator.jsx'
import CustomGPUPanel from '../components/gpumemoryestimator/CustomGPUPanel.jsx'
import TimelineChart from '../components/gpumemoryestimator/TimelineChart.jsx'
import CodegenPanel from '../components/gpumemoryestimator/CodegenPanel.jsx'
import ExportPanel from '../components/gpumemoryestimator/ExportPanel.jsx'

import useMemoryStore from '../store/useMemoryStore.js'
import { deserializeFromURL } from '../utils/urlShare.js'
import gpt2 from '../presets/gpt2_small.json'
import '../styles/gpu.css'

// ─── Collapsible Panel ────────────────────────────────────────────────────────
function CollapsePanel({ id, label, icon, accent = 'var(--nf-accent)', defaultOpen = true, badge, children }) {
  const [open, setOpen] = useState(defaultOpen)
  const contentRef = useRef(null)
  const [height, setHeight] = useState(defaultOpen ? 'auto' : '0px')
  const [animating, setAnimating] = useState(false)

  const toggle = () => {
    if (animating) return
    setAnimating(true)

    if (open) {
      const el = contentRef.current
      if (el) {
        el.style.height = el.scrollHeight + 'px'
        requestAnimationFrame(() => {
          el.style.height = '0px'
        })
      }
      setOpen(false)
      setTimeout(() => { setAnimating(false) }, 380)
    } else {
      setOpen(true)
      setTimeout(() => {
        const el = contentRef.current
        if (el) {
          el.style.height = el.scrollHeight + 'px'
          setTimeout(() => {
            el.style.height = 'auto'
            setAnimating(false)
          }, 380)
        } else {
          setAnimating(false)
        }
      }, 10)
    }
  }

  return (
    <section className={`cp-wrap ${open ? 'cp-open' : 'cp-closed'}`} style={{ '--cp-accent': accent }}>
      {/* Toggle button */}
      <button className="cp-toggle" onClick={toggle} aria-expanded={open}>
        {/* Left side */}
        <div className="cp-toggle-left">
          <span className="cp-chevron">{open ? '▾' : '▸'}</span>
          <span className="cp-icon">{icon}</span>
          <span className="cp-id">[{String(id).padStart(2, '0')}]</span>
          <span className="cp-label">{label}</span>
          {badge && <span className="cp-badge">{badge}</span>}
        </div>
        {/* Right side status */}
        <div className="cp-toggle-right">
          <span className="cp-status-dot" />
          <span className="cp-status-text">{open ? 'ACTIVE' : 'COLLAPSED'}</span>
          <span className="cp-dash-line" />
        </div>
      </button>

      {/* Content */}
      <div
        ref={contentRef}
        className="cp-content"
        style={{ height: open ? 'auto' : '0px' }}
      >
        <div className="cp-inner">
          {children}
        </div>
      </div>
    </section>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
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
          <div className="app-badge">v3.0</div>
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
          <div className="sidebar-section">
            <CustomGPUPanel />
          </div>
          <div className="sidebar-divider" />
          <div className="sidebar-layers">
            <LayerInput />
          </div>
        </aside>

        <main className="app-main">

          {/* ── Always-visible: Memory Analysis ── */}
          <section className="main-panel main-panel--pinned">
            <div className="panel-label" style={{ padding: '10px 16px 0', marginBottom: 0 }}>
              // Memory Analysis
            </div>
            <ResultSummary />
          </section>

          {/* ── Collapsible panels ── */}

          <CollapsePanel
            id={1}
            label="VRAM Breakdown by Layer"
            icon="▤"
            accent="#3266ad"
            defaultOpen={true}
          >
            <MemoryChart />
          </CollapsePanel>

          <CollapsePanel
            id={2}
            label="Memory Timeline"
            icon="◈"
            accent="#5bc8f5"
            defaultOpen={true}
            badge="Training Mode Only"
          >
            <TimelineChart />
          </CollapsePanel>

          <CollapsePanel
            id={3}
            label="Layer Breakdown"
            icon="≡"
            accent="#00e5a0"
            defaultOpen={true}
          >
            {/* Fixed height wrapper preserved from original */}
            <div style={{ height: '420px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <LayerTable />
            </div>
          </CollapsePanel>

          <CollapsePanel
            id={4}
            label="Batch Size Sweep"
            icon="⟳"
            accent="#a78bfa"
            defaultOpen={false}
          >
            <SweepChart />
          </CollapsePanel>

          <CollapsePanel
            id={5}
            label="GPU Fit Matrix"
            icon="⬡"
            accent="#f59e0b"
            defaultOpen={false}
          >
            <GPUTable />
          </CollapsePanel>

          <CollapsePanel
            id={6}
            label="Cloud Cost Estimator"
            icon="$"
            accent="#7df3b4"
            defaultOpen={false}
            badge="Training Mode Only"
          >
            <CostEstimator />
          </CollapsePanel>

          <CollapsePanel
            id={7}
            label="PyTorch Config Codegen"
            icon="{ }"
            accent="#f97316"
            defaultOpen={false}
          >
            <CodegenPanel />
          </CollapsePanel>

          <CollapsePanel
            id={8}
            label="Export"
            icon="↗"
            accent="#ec4899"
            defaultOpen={false}
          >
            <ExportPanel />
          </CollapsePanel>

        </main>
      </div>

      <style>{`
        /* ── Header ── */
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
        .logo-forge  { color: var(--nf-text); }
        .logo-sep    { color: var(--nf-muted); font-weight: 400; margin: 0 4px; }
        .logo-title  { color: var(--nf-muted); font-weight: 400; font-size: 12px; letter-spacing: 0.08em; }
        .app-badge {
          font-size: 9px;
          letter-spacing: 0.15em;
          color: var(--nf-accent);
          border: 1px solid var(--nf-accent);
          padding: 3px 10px;
          border-radius: 2px;
          text-transform: uppercase;
        }

        /* ── Layout ── */
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
        .sidebar-top    { flex-shrink: 0; overflow-y: auto; }
        .sidebar-hf     { flex-shrink: 0; }
        .sidebar-section { flex-shrink: 0; }
        .sidebar-divider { height: 1px; background: var(--nf-border); flex-shrink: 0; }
        .sidebar-layers {
          flex: 1;
          padding: 14px;
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

        /* ── Pinned (always-visible) panel ── */
        .main-panel {
          background: var(--nf-surface);
          border-bottom: 1px solid var(--nf-border);
        }
        .main-panel--pinned {
          flex-shrink: 0;
        }

        /* ══════════════════════════════════════════════
           Collapsible Panel
        ══════════════════════════════════════════════ */
        .cp-wrap {
          background: var(--nf-surface);
          border-bottom: 1px solid var(--nf-border);
          position: relative;
        }

        /* Accent left-bar: only visible when open */
        .cp-open::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--cp-accent);
          opacity: 0.7;
        }

        /* ── Toggle button ── */
        .cp-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px;
          height: 38px;
          background: transparent;
          border: none;
          cursor: pointer;
          user-select: none;
          position: relative;
          transition: background 0.15s;
          gap: 12px;
        }

        .cp-toggle:hover {
          background: rgba(255,255,255,0.025);
        }

        /* Hover glow line at bottom */
        .cp-toggle::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--cp-accent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .cp-toggle:hover::after { opacity: 0.35; }

        /* ── Left cluster ── */
        .cp-toggle-left {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
          flex: 1;
        }

        .cp-chevron {
          font-size: 11px;
          color: var(--cp-accent);
          width: 10px;
          text-align: center;
          flex-shrink: 0;
          transition: transform 0.25s;
          font-family: monospace;
        }

        .cp-icon {
          font-size: 13px;
          color: var(--cp-accent);
          opacity: 0.85;
          width: 16px;
          text-align: center;
          flex-shrink: 0;
        }

        .cp-id {
          font-family: 'Space Mono', monospace;
          font-size: 8px;
          color: var(--nf-muted);
          letter-spacing: 0.1em;
          opacity: 0.6;
          flex-shrink: 0;
        }

        .cp-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--nf-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cp-open .cp-label {
          color: var(--cp-accent);
        }

        .cp-badge {
          font-size: 7px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--cp-accent);
          border: 1px solid var(--cp-accent);
          padding: 1px 5px;
          border-radius: 2px;
          opacity: 0.75;
          flex-shrink: 0;
        }

        /* ── Right cluster ── */
        .cp-toggle-right {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
        }

        .cp-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--cp-accent);
          flex-shrink: 0;
          opacity: 0.5;
          box-shadow: 0 0 6px var(--cp-accent);
          transition: opacity 0.2s, box-shadow 0.2s;
        }
        .cp-open .cp-status-dot {
          opacity: 1;
          animation: cpPulse 2.4s ease-in-out infinite;
        }
        @keyframes cpPulse {
          0%, 100% { box-shadow: 0 0 4px var(--cp-accent); opacity: 0.85; }
          50%       { box-shadow: 0 0 10px var(--cp-accent); opacity: 1; }
        }

        .cp-status-text {
          font-family: 'Space Mono', monospace;
          font-size: 7px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--cp-accent);
          opacity: 0.55;
          width: 62px;
          text-align: right;
        }
        .cp-open .cp-status-text { opacity: 0.8; }

        .cp-dash-line {
          display: block;
          width: 20px;
          height: 1px;
          background: var(--cp-accent);
          opacity: 0.25;
          flex-shrink: 0;
        }
        .cp-open .cp-dash-line { opacity: 0.5; }

        /* ── Animated content ── */
        .cp-content {
          overflow: hidden;
          transition: height 0.36s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: height;
        }

        .cp-inner {
          border-top: 1px solid rgba(255,255,255,0.05);
        }
      `}</style>
    </div>
  )
}