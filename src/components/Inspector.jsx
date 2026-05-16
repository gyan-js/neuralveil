import { useGraphStore } from '../store/useGraphStore.js'
import { LAYER_PARAM_RANGES, LAYER_COLORS } from '../constants/layerDefaults.js'
import { formatShape, countParams } from '../engine/shapeEngine.js'
import { Trash2, X, AlertCircle } from 'lucide-react'

// ─── GENERIC PARAM ROW ───────────────────────────────────────────────────────

function ParamRow({ label, value, min, max, step, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: 'Syne', fontSize: 10, fontWeight: 600,
          color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {label}
        </span>
        <input
          type="number"
          value={value}
          min={min} max={max} step={step}
          onChange={e => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v)) onChange(v)
          }}
          style={{ width: 72 }}
        />
      </div>
      {min !== undefined && max !== undefined && (
        <input
          type="range"
          min={min} max={max} step={step || 1}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
        />
      )}
    </div>
  )
}

// ─── MERGE INSPECTOR ─────────────────────────────────────────────────────────

function MergeInspector({ node, result, format, updateNodeConfig }) {
  const config      = node.data?.config || {}
  const mode        = config.mode || 'add'
  const inputShapes = result?.inputShapes || []
  const outputShape = result?.outputShape

  const setMode = (m) => updateNodeConfig(node.id, { mode: m })

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.12em', marginBottom: 10 }}>
          MERGE MODE
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['add', 'concat'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
                padding: '7px 0', borderRadius: 6, cursor: 'pointer',
                border: `1px solid ${mode === m
                  ? (m === 'add' ? 'rgba(245,158,11,0.6)' : 'rgba(139,92,246,0.6)')
                  : 'rgba(255,255,255,0.1)'}`,
                background: mode === m
                  ? (m === 'add' ? 'rgba(245,158,11,0.12)' : 'rgba(139,92,246,0.12)')
                  : 'transparent',
                color: mode === m
                  ? (m === 'add' ? '#F59E0B' : '#8B5CF6')
                  : 'rgba(255,255,255,0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8, fontFamily: 'JetBrains Mono', fontSize: 8.5, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
          {mode === 'add'
            ? 'Element-wise addition (ResNet style). All input shapes must be identical.'
            : 'Channel concatenation (DenseNet / UNet style). Batch + H × W must match; channels are summed.'}
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.12em', marginBottom: 10 }}>
          INPUT SHAPES
        </div>
        {inputShapes.length === 0 ? (
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
            No inputs connected yet.
          </div>
        ) : (
          inputShapes.map((s, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '5px 8px', marginBottom: 4,
              background: i === 0 ? 'rgba(245,158,11,0.05)' : 'rgba(139,92,246,0.05)',
              border: `1px solid ${i === 0 ? 'rgba(245,158,11,0.12)' : 'rgba(139,92,246,0.12)'}`,
              borderRadius: 5,
            }}>
              <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
                IN {String.fromCharCode(65 + i)}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, color: i === 0 ? '#F59E0B' : '#8B5CF6' }}>
                {s ? formatShape(s, format) : '—'}
              </span>
            </div>
          ))
        )}
      </div>

      <div style={{ background: '#0D1526', border: '1px solid rgba(0,229,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.12em', marginBottom: 8 }}>
          OUTPUT SHAPE
        </div>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: outputShape ? '#39FF14' : '#FF6B35', fontWeight: 600 }}>
          {outputShape ? formatShape(outputShape, format) : '???'}
        </span>
      </div>
    </div>
  )
}

// ─── RESHAPE INSPECTOR ───────────────────────────────────────────────────────

function ReshapeInspector({ node, result, format, updateNodeConfig }) {
  const config      = node.data?.config || {}
  const inputShape  = result?.inputShape
  const outputShape = result?.outputShape

  const update = (key, val) => {
    const v = parseInt(val)
    if (!isNaN(v) && v > 0) updateNodeConfig(node.id, { [key]: v })
  }

  // Compute input element count for display
  const inElements = inputShape
    ? inputShape.slice(1).every(d => d !== null)
      ? inputShape.slice(1).reduce((a, b) => a * b, 1)
      : null
    : null

  const outElements = [config.targetC, config.targetH, config.targetW]
    .filter(d => d !== undefined && d !== null)
    .reduce((a, b) => a * b, 1)

  const mismatch = inElements !== null && outElements !== inElements

  const fieldStyle = {
    display: 'flex', flexDirection: 'column', gap: 4,
  }
  const labelStyle = {
    fontFamily: 'Syne', fontSize: 9, color: 'rgba(0,229,255,0.5)',
    letterSpacing: '0.12em', textTransform: 'uppercase',
  }

  return (
    <div>
      {/* Element count hint */}
      <div style={{
        background: mismatch ? 'rgba(255,107,53,0.07)' : 'rgba(129,140,248,0.05)',
        border: `1px solid ${mismatch ? 'rgba(255,107,53,0.25)' : 'rgba(129,140,248,0.15)'}`,
        borderRadius: 7, padding: '8px 10px', marginBottom: 16,
        fontFamily: 'JetBrains Mono', fontSize: 9, lineHeight: 1.6,
        color: mismatch ? '#FF6B35' : 'rgba(129,140,248,0.8)',
      }}>
        <div>Input elements: <strong>{inElements !== null ? inElements : '?'}</strong></div>
        <div>Target elements: <strong>{outElements}</strong></div>
        {mismatch && <div style={{ marginTop: 4, color: '#FF6B35' }}>⚠ Counts must match.</div>}
      </div>

      {/* TARGET C */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={labelStyle}>Target C</span>
          <input
            type="number" min={1} max={65536} step={1}
            value={config.targetC ?? 64}
            onChange={e => update('targetC', e.target.value)}
            style={{ width: 72 }}
          />
        </div>
        <input type="range" min={1} max={2048} step={1}
          value={config.targetC ?? 64}
          onChange={e => update('targetC', e.target.value)}
        />
      </div>

      {/* TARGET H */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={labelStyle}>Target H</span>
          <input
            type="number" min={1} max={65536} step={1}
            value={config.targetH ?? 8}
            onChange={e => update('targetH', e.target.value)}
            style={{ width: 72 }}
          />
        </div>
        <input type="range" min={1} max={512} step={1}
          value={config.targetH ?? 8}
          onChange={e => update('targetH', e.target.value)}
        />
      </div>

      {/* TARGET W */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={labelStyle}>Target W</span>
          <input
            type="number" min={1} max={65536} step={1}
            value={config.targetW ?? 8}
            onChange={e => update('targetW', e.target.value)}
            style={{ width: 72 }}
          />
        </div>
        <input type="range" min={1} max={512} step={1}
          value={config.targetW ?? 8}
          onChange={e => update('targetW', e.target.value)}
        />
      </div>

      {/* Output shape */}
      <div style={{ background: '#0D1526', border: '1px solid rgba(0,229,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.12em', marginBottom: 8 }}>
          OUTPUT SHAPE
        </div>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: outputShape ? '#39FF14' : '#FF6B35', fontWeight: 600 }}>
          {outputShape ? formatShape(outputShape, format) : '???'}
        </span>
      </div>
    </div>
  )
}

// ─── PERMUTE INSPECTOR ───────────────────────────────────────────────────────

function PermuteInspector({ node, result, format, updateNodeConfig }) {
  const config      = node.data?.config || {}
  const inputShape  = result?.inputShape
  const outputShape = result?.outputShape
  const rank        = inputShape ? inputShape.length : 4

  // permutation is stored as an array e.g. [0,1,2,3]
  const perm = config.permutation ?? Array.from({ length: rank }, (_, i) => i)

  const updatePerm = (idx, val) => {
    const v = parseInt(val)
    if (isNaN(v)) return
    const next = [...perm]
    next[idx] = v
    updateNodeConfig(node.id, { permutation: next })
  }

  // Validation: must be a valid permutation
  const sorted = [...perm].sort((a, b) => a - b)
  const isValid = sorted.every((d, i) => d === i)

  const presets4D = [
    { label: 'identity',  perm: [0, 1, 2, 3] },
    { label: '→ NHWC',   perm: [0, 2, 3, 1] },
    { label: '→ NCHW',   perm: [0, 3, 1, 2] },
    { label: 'flip H×W', perm: [0, 1, 3, 2] },
  ]

  const accentColor = 'rgba(52,211,153,0.6)'  // emerald clr

  return (
    <div>
  
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.12em', marginBottom: 10 }}>
          DIM ORDER
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {perm.map((val, idx) => (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontFamily: 'Syne', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
                dim{idx}
              </span>
              <input
                type="number"
                min={0} max={rank - 1} step={1}
                value={val}
                onChange={e => updatePerm(idx, e.target.value)}
                style={{ width: '100%', textAlign: 'center' }}
              />
            </div>
          ))}
        </div>
        {!isValid && (
          <div style={{
            marginTop: 8, fontFamily: 'JetBrains Mono', fontSize: 8.5,
            color: '#FF6B35', lineHeight: 1.5,
          }}>
            ⚠ [{perm.join(',')}] is not a valid permutation of [0..{rank - 1}].
          </div>
        )}
      </div>

      {/* Quick presets (only for 4-D tensors) */}
      {rank === 4 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.12em', marginBottom: 8 }}>
            PRESETS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {presets4D.map(({ label, perm: p }) => {
              const active = JSON.stringify(perm) === JSON.stringify(p)
              return (
                <button
                  key={label}
                  onClick={() => updateNodeConfig(node.id, { permutation: p })}
                  style={{
                    fontFamily: 'JetBrains Mono', fontSize: 8.5,
                    padding: '5px 4px', borderRadius: 5, cursor: 'pointer',
                    border: `1px solid ${active ? accentColor : 'rgba(255,255,255,0.1)'}`,
                    background: active ? 'rgba(52,211,153,0.08)' : 'transparent',
                    color: active ? '#34D399' : 'rgba(255,255,255,0.35)',
                    transition: 'all 0.15s ease',
                    letterSpacing: '0.04em',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}


      {inputShape && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.12em', marginBottom: 8 }}>
            DIM MAPPING
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {perm.map((fromIdx, toIdx) => (
              <div key={toIdx} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '3px 8px',
                background: 'rgba(52,211,153,0.04)',
                border: '1px solid rgba(52,211,153,0.1)',
                borderRadius: 4,
              }}>
                <span style={{ fontFamily: 'Syne', fontSize: 8.5, color: 'rgba(255,255,255,0.3)' }}>
                  out[{toIdx}]
                </span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#34D399' }}>
                  ← in[{fromIdx}] = {inputShape[fromIdx] ?? '?'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

   
      <div style={{ background: '#0D1526', border: '1px solid rgba(0,229,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.12em', marginBottom: 8 }}>
          OUTPUT SHAPE
        </div>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: outputShape ? '#39FF14' : '#FF6B35', fontWeight: 600 }}>
          {outputShape ? formatShape(outputShape, format) : '???'}
        </span>
      </div>
    </div>
  )
}




function MHAInspector({ node, result, format, updateNodeConfig }) {
  const config      = node.data?.config || {}
  const inputShape  = result?.inputShape
  const outputShape = result?.outputShape
  const hasError    = !!result?.error

  const embed_dim  = config.embed_dim  ?? 512
  const num_heads  = config.num_heads  ?? 8
  const dropout    = config.dropout    ?? 0.1
  const headDim    = embed_dim % num_heads === 0 ? embed_dim / num_heads : null
  const dimError   = embed_dim % num_heads !== 0

  const update = (key, val) => updateNodeConfig(node.id, { [key]: val })

  return (
    <div>
      {/* head_dim computed field */}
      <div style={{
        background: dimError ? 'rgba(255,107,53,0.07)' : 'rgba(168,85,247,0.05)',
        border: `1px solid ${dimError ? 'rgba(255,107,53,0.25)' : 'rgba(168,85,247,0.2)'}`,
        borderRadius: 7, padding: '8px 10px', marginBottom: 16,
        fontFamily: 'JetBrains Mono', fontSize: 9, lineHeight: 1.7,
        color: dimError ? '#FF6B35' : 'rgba(168,85,247,0.85)',
      }}>
        <div>embed_dim: <strong>{embed_dim}</strong></div>
        <div>num_heads: <strong>{num_heads}</strong></div>
        <div style={{ borderTop: `1px solid ${dimError ? 'rgba(255,107,53,0.2)' : 'rgba(168,85,247,0.15)'}`, marginTop: 5, paddingTop: 5 }}>
          head_dim = {embed_dim} ÷ {num_heads} = <strong style={{ color: dimError ? '#FF6B35' : '#A855F7' }}>
            {dimError ? `${(embed_dim / num_heads).toFixed(2)} ⚠ not integer` : headDim}
          </strong>
        </div>
        {dimError && (
          <div style={{ marginTop: 4, fontSize: 8, color: 'rgba(255,107,53,0.7)' }}>
            embed_dim must be divisible by num_heads.
          </div>
        )}
      </div>

      <ParamRow label="embed_dim" value={embed_dim} min={64} max={2048} step={64}
        onChange={v => update('embed_dim', Math.round(v))} />
      <ParamRow label="num_heads" value={num_heads} min={1} max={64} step={1}
        onChange={v => update('num_heads', Math.round(v))} />
      <ParamRow label="dropout" value={dropout} min={0} max={0.9} step={0.01}
        onChange={v => update('dropout', parseFloat(v.toFixed(2)))} />

      <div style={{ background: '#0D1526', border: '1px solid rgba(0,229,255,0.08)', borderRadius: 8, padding: '10px 12px', marginTop: 4 }}>
        <div style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.12em', marginBottom: 8 }}>
          SHAPE PREVIEW
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>IN</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(0,229,255,0.7)' }}>
              {inputShape ? formatShape(inputShape, format) : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>OUT</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: hasError ? '#FF6B35' : '#39FF14', fontWeight: 600 }}>
              {outputShape ? formatShape(outputShape, format) : '???'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}




// ─── GRU INSPECTOR ───────────────────────────────────────────────────────────
// Mirrors LSTMInspector — GRU has the same shape contract but fewer params.

function GRUInspector({ node, result, format, updateNodeConfig }) {
  const config      = node.data?.config || {}
  const inputShape  = result?.inputShape
  const outputShape = result?.outputShape
  const hasError    = !!result?.error

  const hidden_size      = config.hidden_size      ?? 256
  const num_layers       = config.num_layers       ?? 1
  const bidirectional    = config.bidirectional    ?? false
  const return_sequences = config.return_sequences ?? true

  const update = (key, val) => updateNodeConfig(node.id, { [key]: val })

  const ToggleBtn = ({ label, active, onClick, activeColor }) => (
    <button onClick={onClick} style={{
      flex: 1,
      fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 600,
      padding: '7px 0', borderRadius: 6, cursor: 'pointer',
      border: `1px solid ${active ? activeColor + 'aa' : 'rgba(255,255,255,0.1)'}`,
      background: active ? activeColor + '20' : 'transparent',
      color: active ? activeColor : 'rgba(255,255,255,0.3)',
      transition: 'all 0.15s ease',
    }}>{label}</button>
  )

  return (
    <div>
      <div style={{
        background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.15)',
        borderRadius: 7, padding: '8px 10px', marginBottom: 16,
        fontFamily: 'JetBrains Mono', fontSize: 9, lineHeight: 1.7,
        color: 'rgba(234,179,8,0.8)',
      }}>
        <div>Input: [B, seq_len, input_size]</div>
        <div>Output: {return_sequences
          ? `[B, seq_len, ${bidirectional ? hidden_size * 2 : hidden_size}]`
          : `[B, ${bidirectional ? hidden_size * 2 : hidden_size}]`}
        </div>
        {bidirectional && <div style={{ fontSize: 8, marginTop: 3, color: 'rgba(234,179,8,0.5)' }}>
          Bidirectional: hidden × 2 = {hidden_size * 2}
        </div>}
        <div style={{ fontSize: 8, marginTop: 3, color: 'rgba(234,179,8,0.45)' }}>
          GRU uses reset + update gates — faster than LSTM, ~⅔ the params.
        </div>
      </div>

      <ParamRow label="hidden_size" value={hidden_size} min={16} max={2048} step={16}
        onChange={v => update('hidden_size', Math.round(v))} />
      <ParamRow label="num_layers" value={num_layers} min={1} max={8} step={1}
        onChange={v => update('num_layers', Math.round(v))} />

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'Syne', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          Bidirectional
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ToggleBtn label="OFF" active={!bidirectional} activeColor="#EAB308"
            onClick={() => update('bidirectional', false)} />
          <ToggleBtn label="ON"  active={bidirectional}  activeColor="#EAB308"
            onClick={() => update('bidirectional', true)} />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'Syne', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          Return Sequences
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ToggleBtn label="LAST" active={!return_sequences} activeColor="#A855F7"
            onClick={() => update('return_sequences', false)} />
          <ToggleBtn label="ALL"  active={return_sequences}  activeColor="#A855F7"
            onClick={() => update('return_sequences', true)} />
        </div>
        <div style={{ marginTop: 6, fontFamily: 'JetBrains Mono', fontSize: 8, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>
          {return_sequences ? 'ALL: keeps every timestep → 3D output' : 'LAST: only final timestep → 2D output'}
        </div>
      </div>

      <div style={{ background: '#0D1526', border: '1px solid rgba(0,229,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.12em', marginBottom: 8 }}>
          SHAPE PREVIEW
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>IN</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(0,229,255,0.7)' }}>
              {inputShape ? formatShape(inputShape, format) : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>OUT</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: hasError ? '#FF6B35' : '#39FF14', fontWeight: 600 }}>
              {outputShape ? formatShape(outputShape, format) : '???'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}



function EmbeddingInspector({ node, result, format, updateNodeConfig }) {
  const config      = node.data?.config || {}
  const inputShape  = result?.inputShape
  const outputShape = result?.outputShape
  const hasError    = !!result?.error

  const num_embeddings = config.num_embeddings ?? 10000
  const embedding_dim  = config.embedding_dim  ?? 256

  const update = (key, val) => updateNodeConfig(node.id, { [key]: val })

  return (
    <div>
      <div style={{
        background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.18)',
        borderRadius: 7, padding: '8px 10px', marginBottom: 16,
        fontFamily: 'JetBrains Mono', fontSize: 9, lineHeight: 1.7,
        color: 'rgba(165,180,252,0.8)',
      }}>
        <div>Input: [B, seq_len] — integer token IDs</div>
        <div>Output: [B, seq_len, embed_dim]</div>
        <div style={{ fontSize: 8, marginTop: 3, color: 'rgba(165,180,252,0.45)' }}>
          Params = vocab_size × embed_dim = {(num_embeddings * embedding_dim).toLocaleString()}
        </div>
      </div>

      <ParamRow label="vocab_size" value={num_embeddings} min={256} max={200000} step={256}
        onChange={v => update('num_embeddings', Math.round(v))} />
      <ParamRow label="embed_dim" value={embedding_dim} min={8} max={4096} step={8}
        onChange={v => update('embedding_dim', Math.round(v))} />

      <div style={{ background: '#0D1526', border: '1px solid rgba(0,229,255,0.08)', borderRadius: 8, padding: '10px 12px', marginTop: 4 }}>
        <div style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.12em', marginBottom: 8 }}>
          SHAPE PREVIEW
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>IN</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(0,229,255,0.7)' }}>
              {inputShape ? formatShape(inputShape, format) : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>OUT</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: hasError ? '#FF6B35' : '#39FF14', fontWeight: 600 }}>
              {outputShape ? formatShape(outputShape, format) : '???'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── LSTM INSPECTOR ──────────────────────────────────────────────────────────

function LSTMInspector({ node, result, format, updateNodeConfig }) {
  const config      = node.data?.config || {}
  const inputShape  = result?.inputShape
  const outputShape = result?.outputShape
  const hasError    = !!result?.error

  const hidden_size      = config.hidden_size      ?? 256
  const num_layers       = config.num_layers       ?? 1
  const bidirectional    = config.bidirectional    ?? false
  const return_sequences = config.return_sequences ?? true

  const update = (key, val) => updateNodeConfig(node.id, { [key]: val })

  const ToggleBtn = ({ label, active, onClick, activeColor }) => (
    <button onClick={onClick} style={{
      flex: 1,
      fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 600,
      padding: '7px 0', borderRadius: 6, cursor: 'pointer',
      border: `1px solid ${active ? activeColor + 'aa' : 'rgba(255,255,255,0.1)'}`,
      background: active ? activeColor + '20' : 'transparent',
      color: active ? activeColor : 'rgba(255,255,255,0.3)',
      transition: 'all 0.15s ease',
    }}>{label}</button>
  )

  return (
    <div>
      {/* Info box */}
      <div style={{
        background: 'rgba(244,114,182,0.05)', border: '1px solid rgba(244,114,182,0.15)',
        borderRadius: 7, padding: '8px 10px', marginBottom: 16,
        fontFamily: 'JetBrains Mono', fontSize: 9, lineHeight: 1.7,
        color: 'rgba(244,114,182,0.8)',
      }}>
        <div>Input: [B, seq_len, input_size]</div>
        <div>Output: {return_sequences
          ? `[B, seq_len, ${bidirectional ? hidden_size * 2 : hidden_size}]`
          : `[B, ${bidirectional ? hidden_size * 2 : hidden_size}]`}
        </div>
        {bidirectional && <div style={{ fontSize: 8, marginTop: 3, color: 'rgba(244,114,182,0.5)' }}>
          Bidirectional: hidden × 2 = {hidden_size * 2}
        </div>}
      </div>

      <ParamRow label="hidden_size" value={hidden_size} min={16} max={2048} step={16}
        onChange={v => update('hidden_size', Math.round(v))} />
      <ParamRow label="num_layers" value={num_layers} min={1} max={8} step={1}
        onChange={v => update('num_layers', Math.round(v))} />

      {/* bidirectional toggle */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'Syne', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          Bidirectional
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ToggleBtn label="OFF" active={!bidirectional} activeColor="#F472B6"
            onClick={() => update('bidirectional', false)} />
          <ToggleBtn label="ON"  active={bidirectional}  activeColor="#F472B6"
            onClick={() => update('bidirectional', true)} />
        </div>
      </div>

      {/* return_sequences toggle */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'Syne', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          Return Sequences
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ToggleBtn label="LAST" active={!return_sequences} activeColor="#A855F7"
            onClick={() => update('return_sequences', false)} />
          <ToggleBtn label="ALL"  active={return_sequences}  activeColor="#A855F7"
            onClick={() => update('return_sequences', true)} />
        </div>
        <div style={{ marginTop: 6, fontFamily: 'JetBrains Mono', fontSize: 8, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>
          {return_sequences ? 'ALL: keeps every timestep → 3D output' : 'LAST: only final timestep → 2D output'}
        </div>
      </div>

      <div style={{ background: '#0D1526', border: '1px solid rgba(0,229,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.12em', marginBottom: 8 }}>
          SHAPE PREVIEW
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>IN</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(0,229,255,0.7)' }}>
              {inputShape ? formatShape(inputShape, format) : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>OUT</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: hasError ? '#FF6B35' : '#39FF14', fontWeight: 600 }}>
              {outputShape ? formatShape(outputShape, format) : '???'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}


export default function Inspector() {
  const selectedNodeId  = useGraphStore(s => s.selectedNodeId)
  const nodes           = useGraphStore(s => s.nodes)
  const shapeResults    = useGraphStore(s => s.shapeResults)
  const format          = useGraphStore(s => s.format)
  const updateNodeConfig = useGraphStore(s => s.updateNodeConfig)
  const deleteNode      = useGraphStore(s => s.deleteNode)
  const deselectNode    = useGraphStore(s => s.deselectNode)

  const node    = nodes.find(n => n.id === selectedNodeId)
  const isOpen  = !!node
  const result  = selectedNodeId ? shapeResults[selectedNodeId] : null
  const hasError = !!result?.error

  if (!node) {
    return (
      <div
        className="inspector-panel inspector-closed"
        style={{ width: 290, background: '#080C14', borderLeft: '1px solid rgba(0,229,255,0.07)', flexShrink: 0 }}
      />
    )
  }

  const { layerType, config } = node.data || {}
  const accentColor = LAYER_COLORS[layerType] || '#00E5FF'
  const ranges      = LAYER_PARAM_RANGES[layerType] || {}
  const inputShape  = result?.inputShape
  const outputShape = result?.outputShape
  const params      = inputShape ? countParams(layerType, inputShape, config) : 0

  const update = (key, val) => updateNodeConfig(selectedNodeId, { [key]: val })

  const renderParams = () => {
    if (layerType === 'Merge') {
      return <MergeInspector node={node} result={result} format={format} updateNodeConfig={updateNodeConfig} />
    }
    if (layerType === 'Reshape') {
      return <ReshapeInspector node={node} result={result} format={format} updateNodeConfig={updateNodeConfig} />
    }
    if (layerType === 'Permute') {
      return <PermuteInspector node={node} result={result} format={format} updateNodeConfig={updateNodeConfig} />
    }
    if (layerType === 'MultiHeadAttention') {
      return <MHAInspector node={node} result={result} format={format} updateNodeConfig={updateNodeConfig} />
    }
    if (layerType === 'LSTM') {
      return <LSTMInspector node={node} result={result} format={format} updateNodeConfig={updateNodeConfig} />
    }
    if (layerType === 'GRU') {
      return <GRUInspector node={node} result={result} format={format} updateNodeConfig={updateNodeConfig} />
    }
    if (layerType === 'Embedding') {
      return <EmbeddingInspector node={node} result={result} format={format} updateNodeConfig={updateNodeConfig} />
    }

    if (!config || Object.keys(ranges).length === 0) {
      return (
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', padding: '8px 0' }}>
          No configurable parameters
        </div>
      )
    }

    return Object.entries(ranges).map(([key, range]) => (
      <ParamRow
        key={key}
        label={key}
        value={config[key] ?? 0}
        min={range.min}
        max={range.max}
        step={range.step}
        onChange={val => update(key, val)}
      />
    ))
  }


  const hasCustomUI = ['Merge', 'Reshape', 'Permute', 'MultiHeadAttention', 'LSTM', 'GRU', 'Embedding'].includes(layerType)

  return (
    <div
      className={`inspector-panel ${isOpen ? 'inspector-open' : 'inspector-closed'}`}
      style={{
        width: 290,
        background: '#080C14',
        borderLeft: '1px solid rgba(0,229,255,0.07)',
        flexShrink: 0,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
     
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid rgba(0,229,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#fff', letterSpacing: '0.03em' }}>
            {layerType}
          </span>
          {layerType === 'Merge' && (
            <span style={{
              fontFamily: 'JetBrains Mono', fontSize: 8,
              color: 'rgba(245,158,11,0.6)', background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)', padding: '1px 5px', borderRadius: 3,
            }}>
              {(config?.mode || 'add').toUpperCase()}
            </span>
          )}
        </div>
        <button onClick={deselectNode} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
          <X size={14} color="rgba(255,255,255,0.3)" />
        </button>
      </div>

    
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>


        {!hasCustomUI && (
          <div style={{
            background: '#0D1526', border: '1px solid rgba(0,229,255,0.08)',
            borderRadius: 8, padding: '10px 12px', marginBottom: 18,
          }}>
            <div style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.12em', marginBottom: 8 }}>
              SHAPE PREVIEW
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>IN</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(0,229,255,0.7)' }}>
                  {inputShape ? formatShape(inputShape, format) : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>OUT</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: hasError ? '#FF6B35' : '#39FF14', fontWeight: 600 }}>
                  {outputShape ? formatShape(outputShape, format) : '???'}
                </span>
              </div>
              {params > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, paddingTop: 6, borderTop: '1px solid rgba(0,229,255,0.06)' }}>
                  <span style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>PARAMS</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#FFD700' }}>
                    {params.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        
        {hasError && result?.message && (
          <div style={{
            background: 'rgba(255,107,53,0.07)', border: '1px solid rgba(255,107,53,0.25)',
            borderRadius: 8, padding: '10px 12px', marginBottom: 18,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <AlertCircle size={11} color="#FF6B35" />
              <span style={{ fontFamily: 'Syne', fontSize: 9, color: '#FF6B35', fontWeight: 700, letterSpacing: '0.1em' }}>
                SHAPE ERROR
              </span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, color: '#FF6B35', lineHeight: 1.6, opacity: 0.85 }}>
              {result.message}
            </div>
          </div>
        )}

     
        {layerType !== 'Input' && (
          <div>
            {!hasCustomUI && (
              <div style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.12em', marginBottom: 14 }}>
                PARAMETERS
              </div>
            )}
            {renderParams()}
          </div>
        )}
      </div>

     
      {node.deletable !== false && layerType !== 'Input' && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,229,255,0.06)' }}>
          <button
            className="btn-ghost danger"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => deleteNode(selectedNodeId)}
          >
            <Trash2 size={12} />
            Delete Layer
          </button>
        </div>
      )}
    </div>
  )
}