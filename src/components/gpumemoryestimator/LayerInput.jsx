import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import useMemoryStore from '../../store/useMemoryStore.js'
import { LAYER_TYPES, LAYER_TYPE_MAP } from '../../constants/layerTypes.js'
import { calcLayerParams } from '../../engine/memoryEngine.js'
import { PRECISION_BYTES } from '../../engine/precisionBytes.js'
import '../../styles/gpu.css'
function LayerRow({ layer, index, precisionBytes }) {
  const updateLayer = useMemoryStore((s) => s.updateLayer)
  const removeLayer = useMemoryStore((s) => s.removeLayer)
  const params = calcLayerParams(layer)
  const memGB = (params * precisionBytes) / 1e9

  return (
    <div className="layer-row">
      <div className="lr-index">{index + 1}</div>
      <div className="lr-info">
        <div className="lr-type">{layer.type}</div>
        <div className="lr-cfg">
          {layer.units}
          {layer.output && layer.output !== layer.units ? `→${layer.output}` : ''}
          {layer.seqLen > 1 ? ` · seq:${layer.seqLen}` : ''}
        </div>
      </div>
      <div className="lr-stats">
        <div className="lr-mem">{memGB < 0.001 ? '<0.001' : memGB.toFixed(3)}GB</div>
        <div className="lr-params">{params.toLocaleString()}p</div>
      </div>
      <button className="lr-remove" onClick={() => removeLayer(layer.id)} title="Remove layer">
        ×
      </button>
    </div>
  )
}

export default function LayerInput() {
  const layers = useMemoryStore((s) => s.layers)
  const precision = useMemoryStore((s) => s.precision)
  const addLayerAction = useMemoryStore((s) => s.addLayer)
  const updateLayer = useMemoryStore((s) => s.updateLayer)
  const clearLayers = useMemoryStore((s) => s.clearLayers)

  const precisionBytes = PRECISION_BYTES[precision]

  const [selectedType, setSelectedType] = useState('Dense')
  const typeDef = LAYER_TYPE_MAP[selectedType]

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: typeDef?.defaults ?? {},
  })

  function onTypeChange(e) {
    const t = e.target.value
    setSelectedType(t)
    reset(LAYER_TYPE_MAP[t]?.defaults ?? {})
  }

  function onSubmit(data) {
   
    addLayerAction(selectedType)
    
    useMemoryStore.setState((s) => {
      const last = s.layers[s.layers.length - 1]
      if (!last) return {}
      const updated = s.layers.map((l) =>
        l.id === last.id
          ? {
              ...l,
              units: parseInt(data.units) || l.units,
              output: parseInt(data.output) || l.output,
              seqLen: parseInt(data.seqLen) || l.seqLen || 1,
              extra: parseInt(data.extra) || l.extra || 0,
            }
          : l
      )
      const next = { ...s, layers: updated }
    
      return { layers: updated }
    })
  
    const st = useMemoryStore.getState()
    const last = st.layers[st.layers.length - 1]
    if (last) {
      st.updateLayer(last.id, {
        units: parseInt(data.units) || last.units,
        output: parseInt(data.output) || last.output,
        seqLen: parseInt(data.seqLen) || last.seqLen || 1,
        extra: parseInt(data.extra) || last.extra || 0,
      })
    }
  }

  return (
    <div className="layer-input">
      <div className="li-header">
        <span className="panel-label" style={{ marginBottom: 0 }}>Layer Stack ({layers.length})</span>
        {layers.length > 0 && (
          <button className="btn-clear" onClick={clearLayers}>Clear all</button>
        )}
      </div>

      <div className="layer-list">
        {layers.length === 0 ? (
          <div className="empty-layers">Load a preset or add layers below</div>
        ) : (
          layers.map((layer, i) => (
            <LayerRow key={layer.id} layer={layer} index={i} precisionBytes={precisionBytes} />
          ))
        )}
      </div>

      <form className="add-layer-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="panel-label">Add Layer</div>

        <div className="alf-row">
          <select className="nf-select" value={selectedType} onChange={onTypeChange}>
            {LAYER_TYPES.map((lt) => (
              <option key={lt.value} value={lt.value}>{lt.label}</option>
            ))}
          </select>
        </div>

        <div className="alf-grid">
          {typeDef?.fields.includes('units') && (
            <div>
              <div className="cb-label">{typeDef.fieldLabels.units}</div>
              <input className="nf-input" type="number" {...register('units')} />
            </div>
          )}
          {typeDef?.fields.includes('output') && (
            <div>
              <div className="cb-label">{typeDef.fieldLabels.output}</div>
              <input className="nf-input" type="number" {...register('output')} />
            </div>
          )}
          {typeDef?.fields.includes('seqLen') && (
            <div>
              <div className="cb-label">{typeDef.fieldLabels.seqLen}</div>
              <input className="nf-input" type="number" {...register('seqLen')} />
            </div>
          )}
          {typeDef?.fields.includes('extra') && (
            <div>
              <div className="cb-label">{typeDef.fieldLabels.extra}</div>
              <input className="nf-input" type="number" {...register('extra')} />
            </div>
          )}
        </div>

        {typeDef && (
          <div className="alf-formula">formula: <span>{typeDef.formula}</span></div>
        )}

        <button type="submit" className="btn-add-layer">+ Add Layer</button>
      </form>

      <style>{`
        .layer-input {
          display: flex;
          flex-direction: column;
          height: 100%;
          gap: 0;
        }
        .li-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 0 10px 0;
        }
        .btn-clear {
          background: transparent;
          border: none;
          color: var(--nf-muted);
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          cursor: pointer;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 2px;
          transition: color 0.15s;
        }
        .btn-clear:hover { color: var(--nf-red); }
        .layer-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
          min-height: 0;
        }
        .empty-layers {
          font-size: 10px;
          color: var(--nf-muted);
          text-align: center;
          padding: 20px 0;
          border: 1px dashed var(--nf-border);
          border-radius: 3px;
        }
        .layer-row {
          display: grid;
          grid-template-columns: 20px 1fr auto 22px;
          gap: 8px;
          align-items: center;
          background: var(--nf-surface2);
          border: 1px solid var(--nf-border);
          border-radius: 3px;
          padding: 7px 10px;
          transition: border-color 0.15s;
        }
        .layer-row:hover { border-color: var(--nf-border2); }
        .lr-index {
          font-size: 9px;
          color: var(--nf-muted);
          text-align: center;
        }
        .lr-type {
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--nf-accent2);
          margin-bottom: 1px;
        }
        .lr-cfg {
          font-size: 10px;
          color: var(--nf-text);
        }
        .lr-stats {
          text-align: right;
        }
        .lr-mem {
          font-size: 10px;
          color: var(--nf-accent);
        }
        .lr-params {
          font-size: 9px;
          color: var(--nf-muted);
        }
        .lr-remove {
          background: transparent;
          border: none;
          color: var(--nf-muted);
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          padding: 0 2px;
          border-radius: 2px;
          transition: color 0.15s;
        }
        .lr-remove:hover { color: var(--nf-red); }
        .add-layer-form {
          background: var(--nf-surface2);
          border: 1px dashed var(--nf-border2);
          border-radius: 3px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          flex-shrink: 0;
        }
        .alf-row { display: flex; flex-direction: column; gap: 4px; }
        .alf-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        .alf-formula {
          font-size: 9px;
          color: var(--nf-muted);
          letter-spacing: 0.05em;
        }
        .alf-formula span { color: var(--nf-amber); }
        .cb-label {
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--nf-muted);
          margin-bottom: 3px;
        }
        .btn-add-layer {
          background: var(--nf-accent);
          color: #000;
          border: none;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 8px 12px;
          border-radius: 3px;
          cursor: pointer;
          transition: opacity 0.15s;
          width: 100%;
        }
        .btn-add-layer:hover { opacity: 0.85; }
      `}</style>
    </div>
  )
}