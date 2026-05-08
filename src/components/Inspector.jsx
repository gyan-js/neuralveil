import { useGraphStore } from '../store/useGraphStore.js'
import { LAYER_PARAM_RANGES, LAYER_COLORS } from '../constants/layerDefaults.js'
import { formatShape, countParams } from '../engine/shapeEngine.js'
import { Trash2, X, AlertCircle } from 'lucide-react'

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

export default function Inspector() {
  const selectedNodeId = useGraphStore(s => s.selectedNodeId)
  const nodes = useGraphStore(s => s.nodes)
  const shapeResults = useGraphStore(s => s.shapeResults)
  const format = useGraphStore(s => s.format)
  const updateNodeConfig = useGraphStore(s => s.updateNodeConfig)
  const deleteNode = useGraphStore(s => s.deleteNode)
  const deselectNode = useGraphStore(s => s.deselectNode)

  const node = nodes.find(n => n.id === selectedNodeId)
  const isOpen = !!node

  const result = selectedNodeId ? shapeResults[selectedNodeId] : null
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
  const ranges = LAYER_PARAM_RANGES[layerType] || {}
  const inputShape = result?.inputShape
  const outputShape = result?.outputShape
  const params = inputShape ? countParams(layerType, inputShape, config) : 0

  const update = (key, val) => updateNodeConfig(selectedNodeId, { [key]: val })

  const renderParams = () => {
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

  return (
    <div
      className={`inspector-panel ${isOpen ? 'inspector-open' : 'inspector-closed'}`}
      style={{
        width: 290,
        background: '#080C14',
        borderLeft: '1px solid rgba(0,229,255,0.07)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid rgba(0,229,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: accentColor, boxShadow: `0 0 8px ${accentColor}`,
          }} />
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#fff', letterSpacing: '0.03em' }}>
            {layerType}
          </span>
        </div>
        <button
          onClick={deselectNode}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
        >
          <X size={14} color="rgba(255,255,255,0.3)" />
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* Shape preview */}
        <div style={{
          background: '#0D1526',
          border: '1px solid rgba(0,229,255,0.08)',
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 18,
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

        {/* Error card */}
        {hasError && result?.message && (
          <div style={{
            background: 'rgba(255,107,53,0.07)',
            border: '1px solid rgba(255,107,53,0.25)',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 18,
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

        {/* Parameters */}
        {layerType !== 'Input' && (
          <div>
            <div style={{ fontFamily: 'Syne', fontSize: 9, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.12em', marginBottom: 14 }}>
              PARAMETERS
            </div>
            {renderParams()}
          </div>
        )}
      </div>

      {/* Footer */}
      {node.deletable !== false && layerType !== 'Input' && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(0,229,255,0.06)',
        }}>
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
