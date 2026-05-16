import React from 'react'
import useMemoryStore from '../../store/useMemoryStore.js'
import { PRECISION_LABELS } from '../../engine/precisionBytes.js'
import gpt2 from '../../presets/gpt2_small.json'
import bert from '../../presets/bert_base.json'
import resnet from '../../presets/resnet50.json'
import llama from '../../presets/llama7b.json'
import gpt3 from '../../presets/gpt3_175b.json'
import vitBase from '../../presets/vit_base.json'
import sdUnet from '../../presets/stable_diffusion_unet.json'
import { copyShareURL } from '../../utils/urlShare.js'
import '../../styles/gpu.css'

const PRESETS = [
  { label: 'GPT-2 Small',      data: gpt2    },
  { label: 'BERT-base',        data: bert    },
  { label: 'ResNet-50',        data: resnet  },
  { label: 'LLaMA-7B',        data: llama   },
  { label: 'GPT-3 175B',      data: gpt3    },
  { label: 'ViT-Base',         data: vitBase },
  { label: 'Stable Diff UNet', data: sdUnet  },
]

export default function ControlBar() {
  const batchSize = useMemoryStore((s) => s.batchSize)
  const precision = useMemoryStore((s) => s.precision)
  const mode = useMemoryStore((s) => s.mode)
  const optimizerType = useMemoryStore((s) => s.optimizerType)
  const includeOverhead = useMemoryStore((s) => s.includeOverhead)
  const gradientCheckpointing = useMemoryStore((s) => s.gradientCheckpointing)
  const layers = useMemoryStore((s) => s.layers)
  const setBatchSize = useMemoryStore((s) => s.setBatchSize)
  const setPrecision = useMemoryStore((s) => s.setPrecision)
  const setMode = useMemoryStore((s) => s.setMode)
  const setOptimizer = useMemoryStore((s) => s.setOptimizer)
  const setIncludeOverhead = useMemoryStore((s) => s.setIncludeOverhead)
  const setGradientCheckpointing = useMemoryStore((s) => s.setGradientCheckpointing)
  const loadPreset = useMemoryStore((s) => s.loadPreset)

  const [copied, setCopied] = React.useState(false)

  async function handleShare() {
    const config = { batchSize, precision, mode, optimizerType, includeOverhead }
    const ok = await copyShareURL(layers, config)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="control-bar">

      <section className="cb-section">
        <div className="panel-label"> Global Config</div>

        <div className="cb-row">
          <label className="cb-label">Batch Size</label>
          <input
            className="nf-input"
            type="number"
            min={1}
            max={4096}
            value={batchSize}
            onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
          />
        </div>

        <div className="cb-row">
          <label className="cb-label">Precision</label>
          <select
            className="nf-select"
            value={precision}
            onChange={(e) => setPrecision(e.target.value)}
          >
            {Object.entries(PRECISION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div className="cb-row">
          <label className="cb-label">Mode</label>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${mode === 'inference' ? 'active' : ''}`}
              onClick={() => setMode('inference')}
            >
              Inference
            </button>
            <button
              className={`toggle-btn ${mode === 'training' ? 'active' : ''}`}
              onClick={() => setMode('training')}
            >
              Training
            </button>
          </div>
        </div>

        {mode === 'training' && (
          <div className="cb-row">
            <label className="cb-label">Optimizer</label>
            <div className="toggle-group">
              {[['adam','Adam'],['adamw','AdamW'],['sgd','SGD'],['adam8bit','8-bit']].map(([val, label]) => (
                <button
                  key={val}
                  className={`toggle-btn ${optimizerType === val ? 'active' : ''}`}
                  onClick={() => setOptimizer(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="cb-row cb-switch-row">
          <label className="nf-switch">
            <input
              type="checkbox"
              checked={includeOverhead}
              onChange={(e) => setIncludeOverhead(e.target.checked)}
            />
            <div className="nf-switch-track" />
            <div className="nf-switch-thumb" />
          </label>
          <span className="cb-label">+20% CUDA overhead</span>
        </div>

        {mode === 'training' && (
          <div className="cb-row cb-switch-row">
            <label className="nf-switch">
              <input
                type="checkbox"
                checked={gradientCheckpointing}
                onChange={(e) => setGradientCheckpointing(e.target.checked)}
              />
              <div className="nf-switch-track" />
              <div className="nf-switch-thumb" />
            </label>
            <span className="cb-label" title="Reduces activation memory to O(√L) at the cost of recomputation">
              Gradient checkpointing
            </span>
          </div>
        )}
      </section>

      <div className="cb-divider" />

      {/* Presets */}
      <section className="cb-section">
        <div className="panel-label">Presets</div>
        <div className="preset-grid">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              className="btn-preset"
              onClick={() => loadPreset(p.data)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <div className="cb-divider" />

      {/* Share */}
      <section className="cb-section">
        <div className="panel-label">Share</div>
        <button className="btn-share" onClick={handleShare}>
          {copied ? '✓ Copied!' : '⊕ Copy Share URL'}
        </button>
      </section>

      <style>{`
        .control-bar {
          display: flex;
          flex-direction: column;
          gap: 0;
          height: 100%;
        }
        .cb-section {
          padding: 14px 16px;
        }
        .cb-divider {
          height: 1px;
          background: var(--nf-border);
          flex-shrink: 0;
        }
        .cb-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 10px;
        }
        .cb-switch-row {
          flex-direction: row;
          align-items: center;
          gap: 8px;
        }
        .cb-label {
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--nf-muted);
        }
        .preset-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        .btn-preset {
          background: var(--nf-surface2);
          border: 1px solid var(--nf-border2);
          color: var(--nf-purple);
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 7px 6px;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: center;
        }
        .btn-preset:hover {
          border-color: var(--nf-purple);
          background: rgba(180,143,255,0.08);
        }
        .btn-share {
          width: 100%;
          background: transparent;
          border: 1px solid var(--nf-border2);
          color: var(--nf-accent2);
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          padding: 7px 12px;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s;
          text-transform: uppercase;
        }
        .btn-share:hover {
          border-color: var(--nf-accent2);
          background: rgba(0,184,255,0.06);
        }
      `}</style>
    </div>
  )
}