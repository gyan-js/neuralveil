

import { useEffect, useRef, useState } from 'react'
import { X, Terminal, Upload, CheckCircle2, AlertTriangle, ChevronRight, Copy } from 'lucide-react'
import { useGraphStore } from '../store/useGraphStore.js'
import { loadFromFile, ParseError } from '../engine/fileLoader.js'


const PANEL_WIDTH = 380

const CONFIDENCE_LABEL = (score) => {
  if (score === null) return { text: 'Not computed', color: 'rgba(255,255,255,0.3)' }
  if (score >= 0.8)   return { text: `${Math.round(score * 100)}% — High`, color: '#39FF14' }
  if (score >= 0.6)   return { text: `${Math.round(score * 100)}% — Moderate`, color: '#f59e0b' }
  return               { text: `${Math.round(score * 100)}% — Low — CLI recommended`, color: '#FF6B35' }
}

const STRATEGY_LABEL = {
  fx_trace:      { text: 'torch.fx symbolic trace', color: '#39FF14' },
  forward_hooks: { text: 'register_forward_hook (fallback)', color: '#f59e0b' },
  static:        { text: 'Static AST parse (browser)', color: '#00E5FF' },
}


function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: 'Syne', fontSize: 10, fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.4)',
      marginBottom: 10,
    }}>
      {children}
    </div>
  )
}

function InfoRow({ label, value, valueColor = 'rgba(255,255,255,0.8)' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: valueColor, fontWeight: 500 }}>
        {value}
      </span>
    </div>
  )
}

function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard?.writeText(children).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div style={{ position: 'relative', marginBottom: 8 }}>
      <pre style={{
        margin: 0, padding: '8px 36px 8px 12px',
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6,
        fontFamily: 'JetBrains Mono', fontSize: 11,
        color: '#00E5FF', lineHeight: 1.5,
        overflowX: 'auto', whiteSpace: 'pre',
      }}>
        {children}
      </pre>
      <button
        onClick={handleCopy}
        title="Copy"
        style={{
          position: 'absolute', top: 6, right: 6,
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 2,
          color: copied ? '#39FF14' : 'rgba(255,255,255,0.3)',
          transition: 'color 0.2s',
        }}
      >
        {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
      </button>
    </div>
  )
}

function Divider() {
  return (
    <div style={{
      height: 1, background: 'rgba(255,255,255,0.06)',
      margin: '16px 0',
    }} />
  )
}


function DropZone({ onLoad, onError }) {
  const [dragOver, setDragOver]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const fileInputRef              = useRef(null)

  const handleFiles = async (files) => {
    const jsonFile = Array.from(files).find(f => f.name.endsWith('.json'))
    if (!jsonFile) {
      onError('No .json file found. Drop a neuralveil_output.json file.')
      return
    }
    setLoading(true)
    try {
      const graph = await loadFromFile(jsonFile)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
      onLoad(graph)
    } catch (err) {
      onError(err instanceof ParseError ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer?.files ?? [])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const bgColor = dragOver  ? 'rgba(168,85,247,0.15)'
    : success   ? 'rgba(57,255,20,0.08)'
    : 'rgba(255,255,255,0.03)'

  const borderColor = dragOver  ? 'rgba(168,85,247,0.6)'
    : success   ? 'rgba(57,255,20,0.5)'
    : 'rgba(255,255,255,0.1)'

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onClick={() => fileInputRef.current?.click()}
      style={{
        background:   bgColor,
        border:       `2px dashed ${borderColor}`,
        borderRadius: 8,
        padding:      '20px 16px',
        cursor:       'pointer',
        textAlign:    'center',
        transition:   'all 0.2s ease',
        marginBottom: 4,
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />
      {loading ? (
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#a855f7' }}>
          Loading...
        </span>
      ) : success ? (
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#39FF14' }}>
          ✓ Graph loaded
        </span>
      ) : (
        <>
          <Upload
            size={20}
            color={dragOver ? '#a855f7' : 'rgba(255,255,255,0.25)'}
            style={{ marginBottom: 8 }}
          />
          <div style={{
            fontFamily: 'JetBrains Mono', fontSize: 10,
            color: dragOver ? '#a855f7' : 'rgba(255,255,255,0.4)',
            lineHeight: 1.6,
          }}>
            Drop <span style={{ color: '#00E5FF' }}>neuralveil_output.json</span> here
            <br />
            or <span style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'underline' }}>click to browse</span>
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export default function ExecutionPanel({ isOpen, onClose }) {
  const executionMode    = useGraphStore(s => s.executionMode)
  const parseConfidence  = useGraphStore(s => s.parseConfidence)
  const cliErrors        = useGraphStore(s => s.cliErrors)
  const loadFromCLI      = useGraphStore(s => s.loadFromCLI)
  const nodes            = useGraphStore(s => s.nodes)
  const inputShape       = useGraphStore(s => s.inputShape)

  const [dropError, setDropError] = useState(null)

  // Capture strategy from first non-input node (CLI mode)
  const captureStrategy  = executionMode === 'cli'
    ? (nodes.find(n => n.data?.cliVerified)?.data ? 'cli' : 'static')
    : executionMode

  const confidence   = CONFIDENCE_LABEL(parseConfidence)
  const strategyInfo = STRATEGY_LABEL[executionMode] ?? STRATEGY_LABEL.static

  const handleLoad = (graph) => {
    setDropError(null)
    loadFromCLI(graph)
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const inputShapeStr = inputShape?.join(', ') ?? '—'

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.25)',
            zIndex: 999,
          }}
        />
      )}

      {/* Panel */}
      <div style={{
        position:   'fixed',
        top:        0,
        right:      0,
        width:      PANEL_WIDTH,
        height:     '100vh',
        background: '#0d0d0f',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex:     1000,
        display:    'flex',
        flexDirection: 'column',
        transform:  isOpen ? 'translateX(0)' : `translateX(${PANEL_WIDTH}px)`,
        transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowY:  'auto',
      }}>
        {/* Header */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '16px 18px',
          borderBottom:   '1px solid rgba(255,255,255,0.07)',
          flexShrink:     0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Terminal size={14} color="#a855f7" />
            <span style={{
              fontFamily: 'Syne', fontSize: 13, fontWeight: 700,
              color: '#fff', letterSpacing: '0.04em',
            }}>
              Execution Panel (for PyTorch model code only)
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)', padding: 2, display: 'flex',
              transition: 'color 0.15s',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 18px 32px', flex: 1 }}>

          {/* ── Status ── */}
          <SectionTitle>Current Status</SectionTitle>
          <InfoRow
            label="Parse mode"
            value={strategyInfo.text}
            valueColor={strategyInfo.color}
          />
          <InfoRow
            label="Confidence"
            value={confidence.text}
            valueColor={confidence.color}
          />
          <InfoRow label="Input shape" value={`[${inputShapeStr}]`} />
          <InfoRow
            label="Layers"
            value={String(nodes.filter(n => n.data?.layerType !== 'Input').length)}
          />

          <Divider />

          {/* ── CLI Errors ── */}
          {cliErrors.length > 0 && (
            <>
              <SectionTitle>CLI Errors</SectionTitle>
              <div style={{ marginBottom: 12 }}>
                {cliErrors.map((e, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 6, alignItems: 'flex-start',
                    marginBottom: 6,
                    padding: '6px 10px',
                    background: 'rgba(255,107,53,0.07)',
                    border: '1px solid rgba(255,107,53,0.2)',
                    borderRadius: 6,
                  }}>
                    <AlertTriangle size={11} color="#FF6B35" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{
                      fontFamily: 'JetBrains Mono', fontSize: 10,
                      color: '#FF6B35', lineHeight: 1.5,
                    }}>
                      {e}
                    </span>
                  </div>
                ))}
              </div>
              <Divider />
            </>
          )}

          {/* ── Load CLI output ── */}
          <SectionTitle>Load CLI Output</SectionTitle>
          <p style={{
            fontFamily: 'JetBrains Mono', fontSize: 10,
            color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 12,
          }}>
            Run NeuralVeil locally to capture verified tensor shapes via PyTorch
            execution, then drop the output file below.
          </p>

          <DropZone onLoad={handleLoad} onError={setDropError} />

          {dropError && (
            <div style={{
              marginTop: 8, padding: '6px 10px',
              background: 'rgba(255,107,53,0.08)',
              border: '1px solid rgba(255,107,53,0.25)',
              borderRadius: 6,
              fontFamily: 'JetBrains Mono', fontSize: 9,
              color: '#FF6B35', lineHeight: 1.5,
            }}>
              {dropError}
            </div>
          )}

          <Divider />

          {/* ── Install instructions ── */}
          <SectionTitle>CLI Install</SectionTitle>
          <p style={{
            fontFamily: 'JetBrains Mono', fontSize: 10,
            color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 10,
          }}>
            Install the NeuralVeil CLI in your Python environment (requires PyTorch ≥ 1.8):
          </p>
          <CodeBlock>pip install neuralveil</CodeBlock>

          <p style={{
            fontFamily: 'JetBrains Mono', fontSize: 10,
            color: 'rgba(255,255,255,0.4)', lineHeight: 1.7,
            margin: '10px 0 6px',
          }}>
            Then parse your model:
          </p>
          <CodeBlock>{`neuralveil parse model.py --input ${inputShapeStr} --ouput yourfilename.json`}</CodeBlock>

         

          <Divider />

       
          <SectionTitle>Why run the CLI?</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Exact shapes', 'Real PyTorch tensors — no estimation'],
              ['Dynamic models', 'Handles control flow, data-dependent shapes'],
              ['Air-gapped', 'Runs locally — no code leaves your machine'],
              ['Verified params', 'Exact parameter counts via module.parameters()'],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <ChevronRight size={10} color="#a855f7" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <span style={{
                    fontFamily: 'JetBrains Mono', fontSize: 10,
                    color: 'rgba(255,255,255,0.75)', fontWeight: 500,
                  }}>
                    {title}
                  </span>
                  <span style={{
                    fontFamily: 'JetBrains Mono', fontSize: 10,
                    color: 'rgba(255,255,255,0.35)',
                  }}>
                    {' — '}{desc}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  )
}