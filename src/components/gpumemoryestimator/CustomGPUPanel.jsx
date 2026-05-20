import React, { useState } from 'react'
import useMemoryStore from '../../store/useMemoryStore'

export default function CustomGPUPanel() {
  const customGPUs = useMemoryStore(s => s.customGPUs)
  const addCustomGPU = useMemoryStore(s => s.addCustomGPU)
  const removeCustomGPU = useMemoryStore(s => s.removeCustomGPU)

  const [name, setName] = useState('')
  const [vramGB, setVramGB] = useState('')
  const [error, setError] = useState('')

  const handleAdd = () => {
    setError('')
    const trimmedName = name.trim()
    const vram = parseFloat(vramGB)

    if (!trimmedName) { setError('GPU name is required.'); return }
    if (isNaN(vram) || vram <= 0) { setError('VRAM must be a positive number.'); return }
    if (customGPUs.some(g => g.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError('A GPU with this name already exists.'); return
    }

    addCustomGPU({ name: trimmedName, vramGB: vram })
    setName('')
    setVramGB('')
  }

  return (
    <div style={{ padding: '14px 16px' }}>
      <div className="panel-label" style={{ marginBottom: 12 }}>// Custom GPU Profiles</div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <input
          type="text"
          placeholder="GPU Name (e.g. MI300X)"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ ...inputStyle, flex: 2 }}
        />
        <input
          type="number"
          placeholder="VRAM GB"
          value={vramGB}
          min={1}
          onChange={e => setVramGB(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={handleAdd} style={addBtnStyle} title="Add GPU">+</button>
      </div>

      {error && <div style={{ fontSize: 10, color: '#ff6b6b', marginBottom: 6 }}>{error}</div>}

      {/* Custom GPU list */}
      {customGPUs.length === 0 ? (
        <div style={{ fontSize: 10, color: 'var(--nf-muted)', fontStyle: 'italic' }}>
          No custom GPUs added. Add enterprise or AMD GPUs above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {customGPUs.map(gpu => (
            <div key={gpu.name} style={gpuRowStyle}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, color: 'var(--nf-text)' }}>{gpu.name}</span>
                <span style={{ fontSize: 9, color: 'var(--nf-muted)', marginLeft: 8 }}>{gpu.vramGB} GB</span>
              </div>
              <span style={badgeStyle}>CUSTOM</span>
              <button
                onClick={() => removeCustomGPU(gpu.name)}
                style={removeBtnStyle}
                title="Remove"
              >×</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 9, color: 'var(--nf-muted)', marginTop: 10, lineHeight: 1.5 }}>
        Custom GPUs appear in the GPU fit table and sweep chart alongside built-in GPUs.
      </div>
    </div>
  )
}

const inputStyle = {
  background: 'var(--nf-bg)', border: '1px solid var(--nf-border)', color: 'var(--nf-text)',
  padding: '5px 8px', fontSize: 11, borderRadius: 2,
}
const addBtnStyle = {
  background: 'var(--nf-accent)', border: 'none', color: '#000',
  width: 28, height: 28, fontSize: 16, fontWeight: 700,
  borderRadius: 2, cursor: 'pointer', flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const gpuRowStyle = {
  display: 'flex', alignItems: 'center', gap: 6,
  background: 'var(--nf-bg)', border: '1px solid var(--nf-border)',
  borderRadius: 2, padding: '5px 8px',
}
const badgeStyle = {
  fontSize: 8, letterSpacing: '0.1em', color: '#5bc8f5',
  border: '1px solid #5bc8f5', padding: '1px 5px', borderRadius: 2,
}
const removeBtnStyle = {
  background: 'transparent', border: 'none', color: '#ff6b6b',
  fontSize: 14, cursor: 'pointer', padding: '0 2px', lineHeight: 1,
}