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
import QuantCompare from '../components/gpumemoryestimator/QuantCompare.jsx'
import DistributedPanel from '../components/gpumemoryestimator/DistributedPanel.jsx'
import { Link } from 'react-router'
import useMemoryStore from '../store/useMemoryStore.js'
import { deserializeFromURL } from '../utils/urlShare.js'
import gpt2 from '../presets/gpt2_small.json'
import '../styles/gpu.css'
import logoword from '../assets/logoword.png'
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
        {/* Animated scan line */}
        <div className="header-scanline" />

        {/* Left: Logo + Title */}
        <div className="app-logo">
          <Link to="/" > <img className='h-10' src={logoword} /></Link>
          
        </div>

        {/* Center: System status pills */}
        <div className="header-status-row">
          <div className="status-pill">
            <span className="status-dot status-dot--green" />
            <span className="status-label">COMPUTE</span>
            <span className="status-value">READY</span>
          </div>
          <div className="status-pill">
            <span className="status-dot status-dot--blue" />
            <span className="status-label">ENGINE</span>
            <span className="status-value">ACTIVE</span>
          </div>
          <div className="status-pill">
            <span className="status-dot status-dot--amber" />
            <span className="status-label">MODE</span>
            <span className="status-value">LIVE</span>
          </div>
        </div>

        {/* Right: Version + build info */}
        <div className="app-header-right">
          <div className="header-meta">
            <span className="header-build">BUILD 2025.1</span>
            <span className="header-hash">REF#A3F9</span>
          </div>
          <div className="app-badge">
            <span className="badge-ver-label">VER</span>
            <span className="badge-ver-num">3.0.1</span>
          </div>
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
            id={9}
            label="Quantization Impact Calculator"
            icon="⬡"
            accent="#00e5a0"
            defaultOpen={false}
            badge="FP32 → INT4"
          >
            <QuantCompare />
          </CollapsePanel>

          <CollapsePanel
            id={10}
            label="Distributed Training Cost Model"
            icon="⇶"
            accent="#a78bfa"
            defaultOpen={false}
            badge="Training Mode Only"
          >
            <DistributedPanel />
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
          padding: 0 20px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          overflow: hidden;
          gap: 16px;
        }

        /* Animated top-edge accent bar */
        .app-header::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg,
            transparent 0%,
            var(--nf-accent) 20%,
            #5bc8f5 50%,
            #a78bfa 80%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: headerBeam 4s linear infinite;
        }

        /* Bottom grid-line accent */
        .app-header::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg,
            transparent,
            var(--nf-border2) 15%,
            var(--nf-accent) 50%,
            var(--nf-border2) 85%,
            transparent
          );
          opacity: 0.6;
        }

        @keyframes headerBeam {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Scanline sweep overlay */
        .header-scanline {
          position: absolute;
          top: 0; bottom: 0;
          width: 80px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.025), transparent);
          animation: scanSweep 6s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes scanSweep {
          0%   { left: -80px; }
          100% { left: calc(100% + 80px); }
        }

        /* ── Logo block ── */
        .app-logo {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
        }
        .logo-divider {
          width: 1px;
          height: 28px;
          background: linear-gradient(to bottom, transparent, var(--nf-accent), transparent);
          opacity: 0.5;
        }
        .logo-title-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .logo-title {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--nf-text);
          line-height: 1;
        }
        .logo-subtitle {
          font-family: 'Space Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--nf-muted);
          opacity: 0.55;
          line-height: 1;
        }

        /* ── Center status pills ── */
        .header-status-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
          justify-content: center;
        }
        .status-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px 4px 8px;
          border: 1px solid var(--nf-border2);
          border-radius: 2px;
          background: rgba(255,255,255,0.02);
          transition: border-color 0.2s, background 0.2s;
        }
        .status-pill:hover {
          background: rgba(255,255,255,0.05);
          border-color: var(--nf-accent);
        }
        .status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .status-dot--green  { background: #00e5a0; box-shadow: 0 0 6px #00e5a0; animation: cpPulse2g 2.5s ease-in-out infinite; }
        .status-dot--blue   { background: #5bc8f5; box-shadow: 0 0 6px #5bc8f5; animation: cpPulse2b 2.5s ease-in-out 0.8s infinite; }
        .status-dot--amber  { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; animation: cpPulse2a 2.5s ease-in-out 1.6s infinite; }
        @keyframes cpPulse2g { 0%,100%{opacity:.7;box-shadow:0 0 4px #00e5a0;} 50%{opacity:1;box-shadow:0 0 10px #00e5a0;} }
        @keyframes cpPulse2b { 0%,100%{opacity:.7;box-shadow:0 0 4px #5bc8f5;} 50%{opacity:1;box-shadow:0 0 10px #5bc8f5;} }
        @keyframes cpPulse2a { 0%,100%{opacity:.7;box-shadow:0 0 4px #f59e0b;} 50%{opacity:1;box-shadow:0 0 10px #f59e0b;} }
        .status-label {
          font-family: 'Space Mono', monospace;
          font-size: 7px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--nf-muted);
          opacity: 0.6;
        }
        .status-value {
          font-family: 'Space Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--nf-accent);
          font-weight: 700;
        }

        /* ── Right meta + badge ── */
        .app-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .header-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        .header-build {
          font-family: 'Space Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--nf-muted);
          opacity: 0.5;
        }
        .header-hash {
          font-family: 'Space Mono', monospace;
          font-size: 7px;
          letter-spacing: 0.1em;
          color: var(--nf-accent);
          opacity: 0.4;
        }
        .app-badge {
          display: flex;
          align-items: baseline;
          gap: 4px;
          border: 1px solid var(--nf-accent);
          padding: 4px 10px;
          border-radius: 2px;
          background: rgba(var(--nf-accent-rgb, 50,102,173), 0.07);
          position: relative;
          overflow: hidden;
        }
        .app-badge::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%);
        }
        .badge-ver-label {
          font-family: 'Space Mono', monospace;
          font-size: 7px;
          letter-spacing: 0.15em;
          color: var(--nf-muted);
          opacity: 0.7;
          text-transform: uppercase;
        }
        .badge-ver-num {
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--nf-accent);
          line-height: 1;
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