import { useGraphStore } from '../store/useGraphStore.js'
import { exportToPyTorch, exportToKeras, exportToJSON } from '../engine/exportEngine.js'
import { Download, Save, Upload, Code2, Link, ChevronDown, Cpu, Layers } from 'lucide-react'
import { useRef, useState, useCallback, useEffect } from 'react'

import '../styles/globals.css'

// ─── PRESETS DATA ─────────────────────────────────────────────────────────────
// Inline preset definitions — no file-system import needed in the browser.
// These are the same graphs as the JSON files in src/presets/.

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
      version: '1.0', format: 'NCHW', inputShape: [1, 3, 224, 224],
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

// ─── FORMAT TOGGLE ────────────────────────────────────────────────────────────

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


function PresetsDropdown() {
  const loadFromJSON = useGraphStore(s => s.loadFromJSON)
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(null)   // id of last-loaded preset (for flash feedback)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleLoad = (preset) => {
    loadFromJSON(preset.data)
    setLoaded(preset.id)
    setOpen(false)
    setTimeout(() => setLoaded(null), 1800)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="btn-ghost"
        onClick={() => setOpen(v => !v)}
        style={{ gap: 5 }}
      >
        <Layers size={12} />
        Presets
        <ChevronDown
          size={10}
          style={{ transition: 'transform 0.15s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: '#0D1526',
          border: '1px solid rgba(0,229,255,0.18)',
          borderRadius: 10,
          width: 290,
          zIndex: 500,
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,229,255,0.06)',
        }}>
          <div style={{
            padding: '10px 14px 8px',
            borderBottom: '1px solid rgba(0,229,255,0.07)',
          }}>
            <span style={{
              fontFamily: 'Syne', fontWeight: 700, fontSize: 9,
              color: '#00E5FF', letterSpacing: '0.18em', textTransform: 'uppercase',
            }}>
              ARCHITECTURE PRESETS
            </span>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: 'rgba(255,255,255,0.2)', marginTop: 3 }}>
              One-click load — replaces current graph
            </div>
          </div>

          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleLoad(preset)}
                style={{
                  background: loaded === preset.id ? `${preset.color}12` : 'transparent',
                  border: `1px solid ${loaded === preset.id ? `${preset.color}50` : 'rgba(255,255,255,0.06)'}`,
                  borderLeft: `2px solid ${preset.color}`,
                  borderRadius: 7,
                  padding: '9px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  display: 'flex', flexDirection: 'column', gap: 3,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${preset.color}0a`
                  e.currentTarget.style.borderColor = `${preset.color}40`
                }}
                onMouseLeave={e => {
                  if (loaded !== preset.id) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontFamily: 'Syne', fontWeight: 700, fontSize: 11,
                    color: loaded === preset.id ? preset.color : '#fff',
                    transition: 'color 0.15s ease',
                  }}>
                    {preset.label}
                  </span>
                  {loaded === preset.id && (
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: preset.color }}>
                      ✓ LOADED
                    </span>
                  )}
                </div>
                <span style={{
                  fontFamily: 'JetBrains Mono', fontSize: 8.5,
                  color: 'rgba(255,255,255,0.3)', lineHeight: 1.4,
                }}>
                  {preset.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── EXPORT MODAL ─────────────────────────────────────────────────────────────

function ExportModal({ onClose, nodes, edges, inputShape }) {
  const [tab, setTab] = useState('pytorch')   // 'pytorch' | 'keras'
  const [copyPhase, setCopyPhase] = useState(0) // 0=idle 1=analyzing 2=generating 3=done

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
    fontFamily: 'Syne', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.04em', padding: '6px 16px',
    cursor: 'pointer', border: 'none', borderRadius: 6,
    transition: 'all 0.15s ease',
    background: tab === t ? 'rgba(0,229,255,0.12)' : 'transparent',
    color: tab === t ? '#00E5FF' : 'rgba(255,255,255,0.35)',
    borderBottom: tab === t ? '2px solid #00E5FF' : '2px solid transparent',
  })

  return (
    <div className="export-modal-backdrop" onClick={onClose}>
      <div className="export-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '14px 20px 0',
          borderBottom: '1px solid rgba(0,229,255,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Code2 size={16} color="#00E5FF" />
              <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: '#fff' }}>
                Export Code
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn-ghost" onClick={handleCopy} style={{ minWidth: 160, justifyContent: 'center' }}>
                {phaseLabels[copyPhase]}
              </button>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 18, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          </div>

        
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={tabStyle('pytorch')} onClick={() => setTab('pytorch')}>
              PyTorch
            </button>
            <button style={tabStyle('keras')} onClick={() => setTab('keras')}>
              Keras / TF
            </button>
          </div>
        </div>

  
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <pre className="code-area">{code}</pre>
        </div>
      </div>
    </div>
  )
}



function CopyLinkButton() {
  const exportToURL = useGraphStore(s => s.exportToURL)
  const [phase, setPhase] = useState(0) // 0=idle 1=done

  const handleCopy = () => {
    const url = exportToURL()
    navigator.clipboard.writeText(url).then(() => {
      setPhase(1)
      setTimeout(() => setPhase(0), 2200)
    }).catch(() => {
      // Fallback: prompt the user
      window.prompt('Copy this URL:', url)
    })
  }

  return (
    <button
      className="btn-ghost"
      onClick={handleCopy}
      title="Copy shareable link for this graph"
      style={{ gap: 6, minWidth: 110, justifyContent: 'center' }}
    >
      <Link size={12} />
      {phase === 1 ? '✓ Link copied!' : 'Copy Link'}
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
      `}</style>

      <div style={{
        height: 52,
        background: '#080C14',
        borderBottom: '1px solid rgba(0,229,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
        flexShrink: 0,
        position: 'relative',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 8 }}>
          <LogoIcon />
          <div>
            <span style={{
              fontFamily: 'Syne', fontWeight: 800, fontSize: 15,
              color: '#00E5FF', letterSpacing: '0.06em',
              textShadow: '0 0 20px rgba(0,229,255,0.4)',
            }}>
              (still looking for)
            </span>
            <span style={{
              fontFamily: 'Syne', fontWeight: 400, fontSize: 15,
              color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginLeft: 4,
            }}>
              v.1.1.0
            </span>
          </div>
        </div>

        <div style={{ width: 1, height: 20, background: 'rgba(0,229,255,0.1)' }} />

        <FormatToggle />

        <div style={{ flex: 1 }} />

        
        <PresetsDropdown />

        <div style={{ width: 1, height: 20, background: 'rgba(0,229,255,0.07)' }} />

        <button className="btn-ghost" onClick={() => setShowExport(true)}>
          <Code2 size={12} />
          Export Code
        </button>

        <CopyLinkButton />

        <div style={{ width: 1, height: 20, background: 'rgba(0,229,255,0.07)' }} />

        <button className="btn-ghost" onClick={() => {
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