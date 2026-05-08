import { useGraphStore } from '../store/useGraphStore.js'
import { exportToPyTorch, exportToJSON } from '../engine/exportEngine.js'
import { Download, Save, Upload, Code2 } from 'lucide-react'
import { useRef, useState, useCallback } from 'react'

import '../styles/globals.css'
function LogoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <style>{`
        @keyframes nodePulse {
          0%, 100% { r: 3; opacity: 1; }
          50% { r: 3.8; opacity: 0.7; }
        }
        .lc1 { animation: nodePulse 1.8s ease-in-out infinite; }
        .lc2 { animation: nodePulse 1.8s ease-in-out 0.6s infinite; }
        .lc3 { animation: nodePulse 1.8s ease-in-out 1.2s infinite; }
      `}</style>
      <line x1="4" y1="4" x2="11" y2="18" stroke="#00E5FF" strokeWidth="1.2" strokeOpacity="0.5" />
      <line x1="18" y1="4" x2="11" y2="18" stroke="#00E5FF" strokeWidth="1.2" strokeOpacity="0.5" />
      <line x1="4" y1="4" x2="18" y2="4" stroke="#00E5FF" strokeWidth="1.2" strokeOpacity="0.5" />
      <circle className="lc1" cx="4" cy="4" r="3" fill="#00E5FF" />
      <circle className="lc2" cx="18" cy="4" r="3" fill="#00E5FF" />
      <circle className="lc3" cx="11" cy="18" r="3" fill="#00E5FF" />
    </svg>
  )
}

function FormatToggle() {
  const format = useGraphStore(s => s.format)
  const toggleFormat = useGraphStore(s => s.toggleFormat)
  const isNHWC = format === 'NHWC'

  return (
    <div
      className="format-toggle"
      onClick={toggleFormat}
      style={{ width: 110, height: 28, cursor: 'pointer', userSelect: 'none', position: 'relative' }}
      title="Toggle tensor format"
    >
      <div
        className="format-thumb"
        style={{ left: isNHWC ? '50%' : '2px', width: 'calc(50% - 2px)' }}
      />
      <div style={{ display: 'flex', width: '100%', position: 'relative', zIndex: 1 }}>
        {['NCHW', 'NHWC'].map(f => (
          <div key={f} style={{
            flex: 1, textAlign: 'center', padding: '5px 0',
            fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.04em',
            color: format === f ? '#00E5FF' : 'rgba(255,255,255,0.3)',
            transition: 'color 0.2s ease',
          }}>
            {f}
          </div>
        ))}
      </div>
    </div>
  )
}

function ExportModal({ onClose, code }) {
  const [copied, setCopied] = useState(false)
  const [phase, setPhase] = useState(0) // 0=idle, 1=analyzing, 2=generating, 3=done

  const handleCopy = () => {
    setPhase(1)
    setTimeout(() => setPhase(2), 500)
    setTimeout(() => {
      navigator.clipboard.writeText(code)
      setPhase(3)
      setCopied(true)
      setTimeout(() => { setPhase(0); setCopied(false) }, 2000)
    }, 1000)
  }

  const phaseLabels = ['Copy to clipboard', 'Analyzing graph...', 'Generating code...', '✓ Copied!']

  return (
<>
    <div className="export-modal-backdrop" onClick={onClose}>
      <div className="export-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(0,229,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Code2 size={16} color="#00E5FF" />
            <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: '#fff', letterSpacing: '0.03em' }}>
              PyTorch Export
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              className="btn-ghost"
              onClick={handleCopy}
              style={{ minWidth: 150, justifyContent: 'center' }}
            >
              {phaseLabels[phase]}
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 18, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        </div>
      
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <pre className="code-area">{code}</pre>
        </div>
      </div>
    </div>
    </>
  )
}

export default function TopBar() {
  const nodes = useGraphStore(s => s.nodes)
  const edges = useGraphStore(s => s.edges)
  const inputShape = useGraphStore(s => s.inputShape)
  const format = useGraphStore(s => s.format)
  const loadFromJSON = useGraphStore(s => s.loadFromJSON)
  const [showExport, setShowExport] = useState(false)
  const [exportCode, setExportCode] = useState('')
  const fileRef = useRef(null)

  const handleExport = () => {
    const code = exportToPyTorch(nodes, edges, inputShape)
    setExportCode(code)
    setShowExport(true)
  }

  const handleSaveJSON = () => {
    const json = exportToJSON(nodes, edges, inputShape, format)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'model-graph.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLoadJSON = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => loadFromJSON(ev.target.result)
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <>
    <style> {`
    .btn-ghost {
  background: transparent;
  border: 1px solid rgba(0, 229, 255, 0.3);
  color: var(--cyan);
  font-family: 'Syne', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 5px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex; align-items: center; gap: 6px;
}
.btn-ghost:hover {
  background: rgba(0,229,255,0.08);
  border-color: rgba(0,229,255,0.7);
  box-shadow: 0 0 12px rgba(0,229,255,0.15);
}
.btn-ghost.danger {
  border-color: rgba(255,107,53,0.3);
  color: var(--error);
}
.btn-ghost.danger:hover {
  background: rgba(255,107,53,0.08);
  border-color: rgba(255,107,53,0.7);
  box-shadow: 0 0 12px rgba(255,107,53,0.15);
}
`}
    </style>
      <div style={{
        height: 52,
        background: '#080C14',
        borderBottom: '1px solid rgba(0,229,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 16,
        flexShrink: 0,
        position: 'relative',
        zIndex: 100,
      }}>
    
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 8 }}>
          <LogoIcon />
          <div>
            <span style={{
              fontFamily: 'Syne', fontWeight: 800, fontSize: 15,
              color: '#00E5FF',
              letterSpacing: '0.06em',
              textShadow: '0 0 20px rgba(0,229,255,0.4)',
            }}>
              (still looking for)
            </span>
            <span style={{
              fontFamily: 'Syne', fontWeight: 400, fontSize: 15,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.06em',
              marginLeft: 4,
            }}>
              an unique name
            </span>
          </div>
        </div>

     
        <div style={{ width: 1, height: 20, background: 'rgba(0,229,255,0.1)' }} />

  
        <FormatToggle />

        
        <div style={{ flex: 1 }} />

      
        <button className="btn-ghost" onClick={handleExport}>
          <Code2 size={12} />
          Export PyTorch
        </button>
        <button className="btn-ghost" onClick={handleSaveJSON}>
          <Save size={12} />
          Save JSON
        </button>
        <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
          <Upload size={12} />
          Load JSON
        </button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleLoadJSON} />
      </div>

      {showExport && (
        <ExportModal code={exportCode} onClose={() => setShowExport(false)} />
      )}
    </>
  )
}
