import React, { useState } from 'react'
import useMemoryStore from '../../store/useMemoryStore'

export default function CodegenPanel() {
  const generatedCode = useMemoryStore(s => s.generatedCode)
  const constraintFlags = useMemoryStore(s => s.constraintFlags)
  const [copied, setCopied] = useState({})

  const handleCopy = async (index, code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(p => ({ ...p, [index]: true }))
      setTimeout(() => setCopied(p => ({ ...p, [index]: false })), 2000)
    } catch {}
  }

  const flags = constraintFlags ?? {}
  const activeBadges = [
    flags.needsAMP && 'Mixed Precision',
    flags.needsBnbAdam && '8-bit Adam',
    flags.needsGradAccum && 'Grad Accumulation',
    flags.needsFSDP && 'FSDP',
  ].filter(Boolean)

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
       
        {activeBadges.map(b => (
          <span key={b} style={badgeStyle}>{b}</span>
        ))}
      </div>

      {!generatedCode || generatedCode.length === 0 ? (
        <div style={{ fontSize: 11, color: 'var(--nf-muted)' }}>
          No code blocks generated. Add layers and configure your model.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {generatedCode.map((block, i) => (
            <div key={i} style={blockStyle}>
              {/* Block header */}
              <div style={blockHeaderStyle}>
                <span style={{ fontSize: 9, color: 'var(--nf-accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {block.label}
                </span>
                <button
                  onClick={() => handleCopy(i, block.code)}
                  style={copyBtnStyle}
                >
                  {copied[i] ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              {/* Code */}
              <pre style={preStyle}>
                <code style={{ color: 'var(--nf-text)', fontSize: 11, lineHeight: 1.65 }}>
                  {block.code}
                </code>
              </pre>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 9, color: 'var(--nf-muted)', marginTop: 12, lineHeight: 1.5 }}>
        Code is generated based on detected memory constraints. Replace <code style={{ color: 'var(--nf-accent)' }}>YourModel</code> with your actual model class.
      </div>
    </div>
  )
}

const badgeStyle = {
  fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase',
  color: '#a78bfa', border: '1px solid #a78bfa',
  padding: '2px 6px', borderRadius: 2,
}
const blockStyle = {
  background: 'var(--nf-bg)', border: '1px solid var(--nf-border)', borderRadius: 3, overflow: 'hidden',
}
const blockHeaderStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '6px 12px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--nf-border)',
}
const copyBtnStyle = {
  background: 'transparent', border: '1px solid var(--nf-border)', color: 'var(--nf-muted)',
  fontSize: 9, padding: '2px 8px', borderRadius: 2, cursor: 'pointer', letterSpacing: '0.06em',
}
const preStyle = {
  padding: '12px 14px', margin: 0, overflowX: 'auto',
  fontFamily: "'Courier New', Consolas, monospace",
}