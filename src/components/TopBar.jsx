import { useGraphStore } from '../store/useGraphStore.js'
import { exportToPyTorch, exportToKeras, exportToJSON } from '../engine/exportEngine.js'
import { Download, Save, Upload, Code2, Link, ChevronDown, Cpu, Layers, FileCode2 } from 'lucide-react'
import { useRef, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import '../styles/globals.css'

// ─── PRESETS ──────────────────────────────────────────────────────────────────

const PRESETS = [
  {
    id: 'resnet_block',
    label: 'ResNet Block',
    desc: 'Conv → BN → Dropout → Conv → BN + skip ADD',
    color: '#00E5FF',
    data: {
      version: '1.0', format: 'NCHW', inputShape: [1, 64, 224, 224],
      nodes: [
        { id: 'input',  type: 'Input',     position: { x: 300, y: 30  }, config: {} },
        { id: 'conv1',  type: 'Conv2D',    position: { x: 300, y: 155 }, config: { filters: 64,  kernelSize: 3, stride: 1, padding: 1, dilation: 1 } },
        { id: 'bn1',    type: 'BatchNorm', position: { x: 300, y: 285 }, config: {} },
        { id: 'drop1',  type: 'Dropout',   position: { x: 300, y: 415 }, config: { p: 0.1 } },
        { id: 'conv2',  type: 'Conv2D',    position: { x: 300, y: 545 }, config: { filters: 64,  kernelSize: 3, stride: 1, padding: 1, dilation: 1 } },
        { id: 'bn2',    type: 'BatchNorm', position: { x: 300, y: 675 }, config: {} },
        { id: 'merge1', type: 'Merge',     position: { x: 300, y: 805 }, config: { mode: 'add' } },
      ],
      edges: [
        { id: 'e1', source: 'input',  target: 'conv1'  },
        { id: 'e2', source: 'conv1',  target: 'bn1'    },
        { id: 'e3', source: 'bn1',    target: 'drop1'  },
        { id: 'e4', source: 'drop1',  target: 'conv2'  },
        { id: 'e5', source: 'conv2',  target: 'bn2'    },
        { id: 'e6', source: 'bn2',    target: 'merge1' },
        { id: 'e7', source: 'input',  target: 'merge1' },
      ],
    },
  },
  {
    id: 'transformer_encoder',
    label: 'Transformer Encoder',
    desc: 'Embedding → MultiHeadAttn → LayerNorm → FFN → LayerNorm',
    color: '#A855F7',
    data: {
      version: '1.0', format: 'NCHW', inputShape: [1, 3, 224, 224],
      nodes: [
        { id: 'input',  type: 'Input',              position: { x: 300, y: 30  }, config: {} },
        { id: 'embed1', type: 'Embedding',           position: { x: 300, y: 155 }, config: { num_embeddings: 10000, embedding_dim: 512 } },
        { id: 'mha1',   type: 'MultiHeadAttention',  position: { x: 300, y: 285 }, config: { embed_dim: 512, num_heads: 8, dropout: 0.1 } },
        { id: 'ln1',    type: 'LayerNorm',           position: { x: 300, y: 415 }, config: {} },
        { id: 'dense1', type: 'Dense',               position: { x: 300, y: 545 }, config: { units: 2048 } },
        { id: 'dense2', type: 'Dense',               position: { x: 300, y: 675 }, config: { units: 512  } },
        { id: 'ln2',    type: 'LayerNorm',           position: { x: 300, y: 805 }, config: {} },
      ],
      edges: [
        { id: 'e1', source: 'input',  target: 'embed1' },
        { id: 'e2', source: 'embed1', target: 'mha1'   },
        { id: 'e3', source: 'mha1',   target: 'ln1'    },
        { id: 'e4', source: 'ln1',    target: 'dense1' },
        { id: 'e5', source: 'dense1', target: 'dense2' },
        { id: 'e6', source: 'dense2', target: 'ln2'    },
      ],
    },
  },
  {
    id: 'vgg_block',
    label: 'VGG Block',
    desc: 'Conv×2 → Pool → Conv×2 → Pool → Flatten → FC → Dropout → FC',
    color: '#10B981',
    data: {
      version: '1.0', format: 'NCHW', inputShape: [1, 3, 224, 224],
      nodes: [
        { id: 'input', type: 'Input',     position: { x: 300, y: 30   }, config: {} },
        { id: 'c1',    type: 'Conv2D',    position: { x: 300, y: 155  }, config: { filters: 64,  kernelSize: 3, stride: 1, padding: 1, dilation: 1 } },
        { id: 'c2',    type: 'Conv2D',    position: { x: 300, y: 285  }, config: { filters: 64,  kernelSize: 3, stride: 1, padding: 1, dilation: 1 } },
        { id: 'p1',    type: 'MaxPool2D', position: { x: 300, y: 415  }, config: { kernelSize: 2, stride: 2, padding: 0 } },
        { id: 'c3',    type: 'Conv2D',    position: { x: 300, y: 545  }, config: { filters: 128, kernelSize: 3, stride: 1, padding: 1, dilation: 1 } },
        { id: 'c4',    type: 'Conv2D',    position: { x: 300, y: 675  }, config: { filters: 128, kernelSize: 3, stride: 1, padding: 1, dilation: 1 } },
        { id: 'p2',    type: 'MaxPool2D', position: { x: 300, y: 805  }, config: { kernelSize: 2, stride: 2, padding: 0 } },
        { id: 'fl1',   type: 'Flatten',   position: { x: 300, y: 935  }, config: {} },
        { id: 'fc1',   type: 'Dense',     position: { x: 300, y: 1065 }, config: { units: 4096 } },
        { id: 'd1',    type: 'Dropout',   position: { x: 300, y: 1195 }, config: { p: 0.5 } },
        { id: 'fc2',   type: 'Dense',     position: { x: 300, y: 1325 }, config: { units: 1000 } },
      ],
      edges: [
        { id: 'e1',  source: 'input', target: 'c1'  },
        { id: 'e2',  source: 'c1',    target: 'c2'  },
        { id: 'e3',  source: 'c2',    target: 'p1'  },
        { id: 'e4',  source: 'p1',    target: 'c3'  },
        { id: 'e5',  source: 'c3',    target: 'c4'  },
        { id: 'e6',  source: 'c4',    target: 'p2'  },
        { id: 'e7',  source: 'p2',    target: 'fl1' },
        { id: 'e8',  source: 'fl1',   target: 'fc1' },
        { id: 'e9',  source: 'fc1',   target: 'd1'  },
        { id: 'e10', source: 'd1',    target: 'fc2' },
      ],
    },
  },
  {
    id: 'lstm_classifier',
    label: 'LSTM Classifier',
    desc: 'Embedding → Bidirectional LSTM → Dropout → FC → FC',
    color: '#F472B6',
    data: {
      version: '1.0', format: 'TOKENS', inputShape: [1, 128],
      nodes: [
        { id: 'input',  type: 'Input',     position: { x: 300, y: 30  }, config: {} },
        { id: 'emb1',   type: 'Embedding', position: { x: 300, y: 155 }, config: { num_embeddings: 10000, embedding_dim: 256 } },
        { id: 'lstm1',  type: 'LSTM',      position: { x: 300, y: 285 }, config: { hidden_size: 256, num_layers: 2, bidirectional: true, return_sequences: false } },
        { id: 'drop1',  type: 'Dropout',   position: { x: 300, y: 415 }, config: { p: 0.3 } },
        { id: 'fc1',    type: 'Dense',     position: { x: 300, y: 545 }, config: { units: 128 } },
        { id: 'fc2',    type: 'Dense',     position: { x: 300, y: 675 }, config: { units: 10  } },
      ],
      edges: [
        { id: 'e1', source: 'input',  target: 'emb1'  },
        { id: 'e2', source: 'emb1',   target: 'lstm1' },
        { id: 'e3', source: 'lstm1',  target: 'drop1' },
        { id: 'e4', source: 'drop1',  target: 'fc1'   },
        { id: 'e5', source: 'fc1',    target: 'fc2'   },
      ],
    },
  },
]

// ─── LOGO ─────────────────────────────────────────────────────────────────────

function ForgeSpark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <style>{`
        @keyframes outerRing {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes innerDot {
          0%, 100% { r: 2; }
          50% { r: 2.6; }
        }
        @keyframes spikePulse {
          0%, 100% { opacity: 0.6; stroke-width: 1.5; }
          50% { opacity: 1; stroke-width: 2; }
        }
        .outer-ring { animation: outerRing 2.4s ease-in-out infinite; }
        .inner-dot  { animation: innerDot 2.4s ease-in-out infinite; }
        .spike      { animation: spikePulse 2.4s ease-in-out infinite; }
      `}</style>
      <circle className="outer-ring" cx="11" cy="11" r="4" fill="none" stroke="#c9a84c" strokeWidth="1" />
      <circle className="inner-dot" cx="11" cy="11" r="2" fill="#c9a84c" opacity="0.9" />
      <line className="spike" x1="11" y1="1"  x2="11" y2="5"  stroke="#ff5e1a" strokeLinecap="round" />
      <line className="spike" x1="11" y1="17" x2="11" y2="21" stroke="#ff5e1a" strokeLinecap="round" />
      <line className="spike" x1="1"  y1="11" x2="5"  y2="11" stroke="#ff5e1a" strokeLinecap="round" />
      <line className="spike" x1="17" y1="11" x2="21" y2="11" stroke="#ff5e1a" strokeLinecap="round" />
      <line x1="3.5"  y1="3.5"  x2="6.5"  y2="6.5"  stroke="#c9a84c" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <line x1="15.5" y1="15.5" x2="18.5" y2="18.5" stroke="#c9a84c" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

// ─── FORMAT TOGGLE ────────────────────────────────────────────────────────────

function FormatToggle() {
  const format = useGraphStore(s => s.format)
  const toggleFormat = useGraphStore(s => s.toggleFormat)
  const isNHWC = format === 'NHWC'

  return (
    <div
      onClick={toggleFormat}
      title="Toggle tensor format"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: 108,
        height: 26,
        background: 'rgba(0,229,255,0.04)',
        border: '1px solid rgba(0,229,255,0.18)',
        borderRadius: 5,
        cursor: 'pointer',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* sliding pill */}
      <div style={{
        position: 'absolute',
        top: 2, bottom: 2,
        left: isNHWC ? 'calc(50% + 2px)' : 2,
        width: 'calc(50% - 4px)',
        background: 'rgba(0,229,255,0.12)',
        border: '1px solid rgba(0,229,255,0.35)',
        borderRadius: 3,
        transition: 'left 0.22s cubic-bezier(.4,0,.2,1)',
        boxShadow: '0 0 8px rgba(0,229,255,0.18)',
      }} />
      {['NCHW', 'NHWC'].map(f => (
        <div key={f} style={{
          flex: 1, textAlign: 'center',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9, fontWeight: 700,
          letterSpacing: '0.08em',
          color: format === f ? '#00E5FF' : 'rgba(255,255,255,0.25)',
          transition: 'color 0.2s ease',
          position: 'relative', zIndex: 1,
        }}>
          {f}
        </div>
      ))}
    </div>
  )
}

// ─── PRESETS DROPDOWN ─────────────────────────────────────────────────────────
// Uses a React portal so the dropdown renders into document.body,
// fully escaping any parent overflow:hidden or stacking context.

function PresetsDropdown() {
  const loadFromJSON = useGraphStore(s => s.loadFromJSON)
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(null)
  const btnRef = useRef(null)
  const dropRef = useRef(null)
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 })

  // Position dropdown relative to button using fixed coords
  const openDropdown = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setDropPos({
        top: r.bottom + 6,
        right: window.innerWidth - r.right,
      })
    }
    setOpen(v => !v)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        dropRef.current && !dropRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleLoad = (preset) => {
    loadFromJSON(preset.data)
    setLoaded(preset.id)
    setOpen(false)
    setTimeout(() => setLoaded(null), 1800)
  }

  const dropdown = open ? createPortal(
    <div
      ref={dropRef}
      style={{
        position: 'fixed',
        top: dropPos.top,
        right: dropPos.right,
        background: '#080C14',
        border: '1px solid rgba(0,229,255,0.18)',
        borderRadius: 8,
        width: 300,
        zIndex: 99999,
        boxShadow: '0 16px 56px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,229,255,0.05)',
      }}
    >
      <div style={{
        padding: '9px 14px 8px',
        borderBottom: '1px solid rgba(0,229,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 700, fontSize: 9,
          color: '#00E5FF', letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>
          // ARCHITECTURE PRESETS
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7.5, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.04em' }}>
          {PRESETS.length} templates
        </span>
      </div>

      <div style={{ padding: '6px 8px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleLoad(preset)}
            style={{
              background: loaded === preset.id ? `${preset.color}10` : 'transparent',
              border: `1px solid ${loaded === preset.id ? `${preset.color}40` : 'rgba(255,255,255,0.05)'}`,
              borderLeft: `2px solid ${preset.color}`,
              borderRadius: 5,
              padding: '8px 11px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.14s ease',
              display: 'flex', flexDirection: 'column', gap: 3,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${preset.color}0d`
              e.currentTarget.style.borderColor = `${preset.color}35`
              e.currentTarget.style.boxShadow = `inset 0 0 12px ${preset.color}06`
            }}
            onMouseLeave={e => {
              if (loaded !== preset.id) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 10.5,
                color: loaded === preset.id ? preset.color : 'rgba(255,255,255,0.85)',
                letterSpacing: '0.03em',
                transition: 'color 0.15s ease',
              }}>
                {preset.label}
              </span>
              {loaded === preset.id && (
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7.5, color: preset.color, letterSpacing: '0.08em' }}>
                  ✓ LOADED
                </span>
              )}
            </div>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
              color: 'rgba(255,255,255,0.25)', lineHeight: 1.5, letterSpacing: '0.02em',
            }}>
              {preset.desc}
            </span>
          </button>
        ))}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        className="nv-btn"
        onClick={openDropdown}
      >
        <Layers size={11} />
        <span>PRESETS</span>
        <ChevronDown
          size={9}
          style={{ transition: 'transform 0.18s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.6 }}
        />
      </button>
      {dropdown}
    </div>
  )
}

// ─── EXPORT MODAL ─────────────────────────────────────────────────────────────

function ExportModal({ onClose, nodes, edges, inputShape }) {
  const [tab, setTab] = useState('pytorch')
  const [copyPhase, setCopyPhase] = useState(0)

  const code = tab === 'pytorch'
    ? exportToPyTorch(nodes, edges, inputShape)
    : exportToKeras(nodes, edges, inputShape)

  const handleCopy = () => {
    setCopyPhase(1)
    setTimeout(() => setCopyPhase(2), 500)
    setTimeout(() => {
      navigator.clipboard.writeText(code)
      setCopyPhase(3)
      setTimeout(() => setCopyPhase(0), 2000)
    }, 1000)
  }

  const phaseLabels = ['Copy to clipboard', 'Analyzing graph...', 'Generating code...', '✓ Copied!']

  const tabStyle = (t) => ({
    fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.08em', padding: '6px 18px', textTransform: 'uppercase',
    cursor: 'pointer', border: 'none', borderRadius: 0,
    transition: 'all 0.15s ease',
    background: 'transparent',
    color: tab === t ? '#00E5FF' : 'rgba(255,255,255,0.3)',
    borderBottom: tab === t ? '2px solid #00E5FF' : '2px solid transparent',
  })

  return (
    <div className="export-modal-backdrop" onClick={onClose}>
      <div className="export-modal" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 20px 0', borderBottom: '1px solid rgba(0,229,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Code2 size={14} color="#00E5FF" />
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color: '#fff', letterSpacing: '0.06em' }}>
                EXPORT CODE
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="nv-btn" onClick={handleCopy} style={{ minWidth: 160, justifyContent: 'center' }}>
                {phaseLabels[copyPhase]}
              </button>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 20, lineHeight: 1, transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
              >
                ×
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 0 }}>
            <button style={tabStyle('pytorch')} onClick={() => setTab('pytorch')}>PyTorch</button>
            <button style={tabStyle('keras')} onClick={() => setTab('keras')}>Keras / TF</button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <pre className="code-area">{code}</pre>
        </div>
      </div>
    </div>
  )
}

// ─── COPY LINK BUTTON ─────────────────────────────────────────────────────────

function CopyLinkButton() {
  const exportToURL = useGraphStore(s => s.exportToURL)
  const [phase, setPhase] = useState(0)

  const handleCopy = () => {
    const url = exportToURL()
    navigator.clipboard.writeText(url).then(() => {
      setPhase(1)
      setTimeout(() => setPhase(0), 2200)
    }).catch(() => {
      window.prompt('Copy this URL:', url)
    })
  }

  return (
    <button
      className="nv-btn"
      onClick={handleCopy}
      title="Copy shareable link for this graph"
    >
      <Link size={11} />
      <span>{phase === 1 ? '✓ COPIED' : 'COPY LINK'}</span>
    </button>
  )
}

// ─── IMPORT CODE BUTTON ───────────────────────────────────────────────────────

function ImportCodeButton() {
  const openCodeImport = useGraphStore(s => s.openCodeImport)
  const importWarnings = useGraphStore(s => s.importWarnings)
  const [justImported, setJustImported] = useState(false)

  useEffect(() => {
    if (importWarnings.length > 0 || (importWarnings.length === 0 && justImported)) {}
  }, [importWarnings])

  return (
    <button
      className="nv-btn nv-btn--accent"
      onClick={openCodeImport}
      title="Import graph from PyTorch or Keras code"
      style={{ position: 'relative' }}
    >
      <FileCode2 size={11} />
      <span>IMPORT CODE</span>
      <span style={{
        position: 'absolute',
        top: -5, right: -5,
        background: '#39FF14',
        color: '#000',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 6, fontWeight: 800,
        letterSpacing: '0.1em',
        padding: '1px 4px',
        borderRadius: 2,
        lineHeight: 1.5,
      }}>
        NEW
      </span>
    </button>
  )
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────

export default function TopBar() {
  const nodes = useGraphStore(s => s.nodes)
  const edges = useGraphStore(s => s.edges)
  const inputShape = useGraphStore(s => s.inputShape)
  const format = useGraphStore(s => s.format)
  const loadFromJSON = useGraphStore(s => s.loadFromJSON)
  const [showExport, setShowExport] = useState(false)
  const fileRef = useRef(null)
  const navigate = useNavigate()

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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@600;700;800&display=swap');

        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(600%); }
        }

        @keyframes borderGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,229,255,0); }
          50% { box-shadow: 0 0 14px 0 rgba(0,229,255,0.07); }
        }

        .nv-topbar {
          position: relative;
          height: 50px;
          background: #060A11;
          display: flex;
          align-items: center;
          padding: 0 18px;
          gap: 10px;
          flex-shrink: 0;
          z-index: 100;

          animation: borderGlow 4s ease-in-out infinite;
        }

        /* subtle scanline sweep */
        .nv-topbar::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(0,229,255,0.012) 3px,
            rgba(0,229,255,0.012) 4px
          );
          pointer-events: none;
          z-index: 0;
        }

        /* animated sweep light */
        .nv-topbar::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.5) 50%, transparent 100%);
          animation: scanline 6s linear infinite;
          pointer-events: none;
          z-index: 1;
        }

        .nv-topbar-bottom-border {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(0,229,255,0.12) 20%,
            rgba(0,229,255,0.22) 50%,
            rgba(0,229,255,0.12) 80%,
            transparent 100%
          );
        }

        .nv-topbar-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          width: 100%;
          gap: 10px;
        }

        /* ─ Logo ─ */
        .nv-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          cursor: pointer;
          flex-shrink: 0;
        }

        .nv-logo-wordmark {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .nv-logo-name {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.22em;
          color: #fff;
          line-height: 1;
        }

        .nv-logo-name strong {
          color: #00E5FF;
        }

        .nv-logo-version {
          font-family: 'JetBrains Mono', monospace;
          font-size: 7px;
          font-weight: 600;
          color: rgba(0,229,255,0.35);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          line-height: 1;
        }

   
        .nv-divider {
          width: 1px;
          height: 18px;
          background: linear-gradient(180deg, transparent, rgba(0,229,255,0.2), transparent);
          flex-shrink: 0;
        }

       
        .nv-section-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          font-weight: 700;
          color: rgba(0,229,255,0.3);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          user-select: none;
        }
        .nv-btn {
          background: transparent;
          border: 1px solid rgba(0,229,255,0.18);
          color: rgba(255,255,255,0.55);
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          padding: 0 12px;
          height: 28px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.16s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .nv-btn:hover {
          background: rgba(0,229,255,0.06);
          border-color: rgba(0,229,255,0.45);
          color: #00E5FF;
          box-shadow: 0 0 10px rgba(0,229,255,0.1), inset 0 0 8px rgba(0,229,255,0.04);
        }

        /* accent green for Import */
        .nv-btn--accent {
          border-color: rgba(57,255,20,0.25);
          color: rgba(57,255,20,0.7);
        }

        .nv-btn--accent:hover {
          background: rgba(57,255,20,0.06);
          border-color: rgba(57,255,20,0.5);
          color: #39FF14;
          box-shadow: 0 0 10px rgba(57,255,20,0.1), inset 0 0 8px rgba(57,255,20,0.04);
        }

        /* ─ Group container ─ */
        .nv-group {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 2px;
        }
      `}</style>

      <div className="nv-topbar">
        <div className="nv-topbar-bottom-border" />

        <div className="nv-topbar-content">

          {/* ── Logo ── */}
          <a className="nv-logo" onClick={() => navigate('/')}>
        
            <div className="nv-logo-wordmark">
              <div className="nv-logo-name">
                <strong>NEURAL</strong>VEIL
              </div>
              <div className="nv-logo-version">V3.0.1-GAMMA // GRAPH EDITOR</div>
            </div>
          </a>

          <div className="nv-divider" />

          {/* ── Format Toggle ── */}
          <FormatToggle />

          {/* ── Spacer ── */}
          <div style={{ flex: 1 }} />

          {/* ── Presets ── */}
          <div className="nv-group">
            <span className="nv-section-tag">// arch</span>
            <PresetsDropdown />
          </div>

          <div className="nv-divider" />

          {/* ── Code actions ── */}
          <div className="nv-group">
            <span className="nv-section-tag">// code</span>
            <ImportCodeButton />
            <button className="nv-btn" onClick={() => setShowExport(true)}>
              <Code2 size={11} />
              <span>EXPORT CODE</span>
            </button>
          </div>

          <div className="nv-divider" />

          
          <div className="nv-group">
            <span className="nv-section-tag">// io</span>
            <CopyLinkButton />
            <button className="nv-btn" onClick={() => {
              const exportNodes = nodes.map(n => ({
                id: n.id, type: n.data?.layerType,
                position: n.position, config: n.data?.config || {},
              }))
              const json = JSON.stringify({
                version: '1.0', format, inputShape,
                nodes: exportNodes,
                edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
              }, null, 2)
              const blob = new Blob([json], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = 'model-graph.json'; a.click()
              URL.revokeObjectURL(url)
            }}>
              <Save size={11} />
              <span>SAVE JSON</span>
            </button>
            <button className="nv-btn" onClick={() => fileRef.current?.click()}>
              <Upload size={11} />
              <span>LOAD JSON</span>
            </button>
          </div>

          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleLoadJSON} />
        </div>
      </div>

      {showExport && (
        <ExportModal
          nodes={nodes}
          edges={edges}
          inputShape={inputShape}
          onClose={() => setShowExport(false)}
        />
      )}
    </>
  )
}