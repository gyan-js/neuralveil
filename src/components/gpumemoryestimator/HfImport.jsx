import React, { useState } from 'react'
import useMemoryStore from '../../store/useMemoryStore.js'
import '../../styles/gpu.css'

async function fetchHFConfig(modelName) {
  const url = `https://huggingface.co/${modelName}/resolve/main/config.json`
  const res = await fetch(url)

  if (res.status === 401 || res.status === 403) {
    const err = new Error(
      `"${modelName}" is a gated model. You must accept its license on HuggingFace before it can be accessed here. Visit huggingface.co/${modelName} to request access.`
    )
    err.type = 'gated'
    throw err
  }
  if (res.status === 404) {
    const err = new Error(
      `Model "${modelName}" was not found on HuggingFace. Double-check the name (e.g. "gpt2", "bert-base-uncased", "meta-llama/Llama-2-7b-hf").`
    )
    err.type = 'not_found'
    throw err
  }
  if (!res.ok) {
    const err = new Error(`HuggingFace returned HTTP ${res.status}. Try again or check your connection.`)
    err.type = 'api_error'
    throw err
  }

  return res.json()
}

function makeGPT2Layers(cfg) {
  const { n_layer, n_embd, vocab_size, n_positions = 1024 } = cfg
  const ls = [{ type: 'Embedding', units: vocab_size, output: n_embd, seqLen: 1 }]
  for (let i = 0; i < n_layer; i++) {
    ls.push({ type: 'MultiHeadAttention', units: n_embd, output: n_embd, seqLen: n_positions })
    ls.push({ type: 'LayerNorm',          units: n_embd, output: n_embd, seqLen: 1 })
    ls.push({ type: 'Dense',              units: n_embd, output: n_embd * 4, seqLen: 1 })
    ls.push({ type: 'Dense',              units: n_embd * 4, output: n_embd, seqLen: 1 })
    ls.push({ type: 'LayerNorm',          units: n_embd, output: n_embd, seqLen: 1 })
  }
  return { layers: ls, arch: 'GPT-2', info: `${n_layer}L · ${n_embd}d · ${vocab_size.toLocaleString()} vocab` }
}

function makeBERTLayers(cfg) {
  const { num_hidden_layers, hidden_size, vocab_size, max_position_embeddings = 512 } = cfg
  const ls = [{ type: 'Embedding', units: vocab_size, output: hidden_size, seqLen: 1 }]
  for (let i = 0; i < num_hidden_layers; i++) {
    ls.push({ type: 'MultiHeadAttention', units: hidden_size, output: hidden_size, seqLen: max_position_embeddings })
    ls.push({ type: 'LayerNorm',          units: hidden_size, output: hidden_size, seqLen: 1 })
    ls.push({ type: 'Dense',              units: hidden_size, output: hidden_size * 4, seqLen: 1 })
    ls.push({ type: 'Dense',              units: hidden_size * 4, output: hidden_size, seqLen: 1 })
    ls.push({ type: 'LayerNorm',          units: hidden_size, output: hidden_size, seqLen: 1 })
  }
  return { layers: ls, arch: 'BERT', info: `${num_hidden_layers}L · ${hidden_size}d · ${vocab_size.toLocaleString()} vocab` }
}

function makeLlamaLayers(cfg) {
  const { num_hidden_layers, hidden_size, intermediate_size, vocab_size, max_position_embeddings = 4096 } = cfg
  const ffn = intermediate_size || hidden_size * 4
  const ls = [{ type: 'Embedding', units: vocab_size, output: hidden_size, seqLen: 1 }]
  for (let i = 0; i < num_hidden_layers; i++) {
    ls.push({ type: 'MultiHeadAttention', units: hidden_size, output: hidden_size, seqLen: max_position_embeddings })
    ls.push({ type: 'LayerNorm',          units: hidden_size, output: hidden_size, seqLen: 1 })
    ls.push({ type: 'Dense',              units: hidden_size, output: ffn, seqLen: 1 })
    ls.push({ type: 'Dense',              units: ffn, output: hidden_size, seqLen: 1 })
    ls.push({ type: 'Dense',             units: hidden_size, output: ffn, seqLen: 1 })  // SwiGLU gate
    ls.push({ type: 'LayerNorm',          units: hidden_size, output: hidden_size, seqLen: 1 })
  }
  return { layers: ls, arch: 'LLaMA/Mistral', info: `${num_hidden_layers}L · ${hidden_size}d · ${vocab_size.toLocaleString()} vocab` }
}

function parseHFConfig(config) {
  const arch  = config.architectures?.[0] || ''
  const mtype = config.model_type || ''

  if (mtype === 'gpt2' || arch.includes('GPT2'))
    return makeGPT2Layers(config)

  if (['bert','roberta','distilbert','albert'].includes(mtype) || arch.includes('Bert') || arch.includes('Roberta'))
    return makeBERTLayers(config)

  if (['llama','mistral','gemma','phi','qwen2','falcon'].includes(mtype) || arch.includes('Llama') || arch.includes('Mistral') || arch.includes('Gemma') || arch.includes('Falcon'))
    return makeLlamaLayers(config)

  // Generic transformer fallback
  if (config.num_hidden_layers && config.hidden_size)
    return makeBERTLayers(config)
  if (config.n_layer && config.n_embd)
    return makeGPT2Layers(config)

  const err = new Error(
    `Model type "${mtype || arch || 'unknown'}" is not yet supported. Supported architectures: GPT-2, BERT, RoBERTa, LLaMA, Mistral, Gemma, Falcon, Phi, Qwen2.`
  )
  err.type = 'unsupported'
  throw err
}



const ERROR_META = {
  gated:      { icon: '🔒', color: 'var(--nf-amber)',  label: 'Gated model' },
  not_found:  { icon: '🔍', color: 'var(--nf-red)',    label: 'Not found' },
  unsupported:{ icon: '⚠',  color: 'var(--nf-amber)',  label: 'Unsupported' },
  api_error:  { icon: '⚡', color: 'var(--nf-red)',    label: 'API error' },
}



export default function HFImport() {
  const loadPreset = useMemoryStore((s) => s.loadPreset)

  const [modelName, setModelName]   = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)   // { message, type }
  const [success, setSuccess]       = useState(null)   // { arch, info }

  async function handleImport() {
    const name = modelName.trim()
    if (!name) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const config = await fetchHFConfig(name)
      const { layers, arch, info } = parseHFConfig(config)
      loadPreset({ layers })
      setSuccess({ arch, info, name })
    } catch (e) {
      setError({ message: e.message, type: e.type || 'api_error' })
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleImport()
  }

  const errMeta = error ? (ERROR_META[error.type] || ERROR_META.api_error) : null

  return (
    <div className="hf-wrap">
      <div className="hf-header">
        <span className="panel-label" style={{ marginBottom: 0 }}>HuggingFace Import</span>
        <a
          href="https://huggingface.co/models"
          target="_blank"
          rel="noreferrer"
          className="hf-browse-link"
        >
          Browse models ↗
        </a>
      </div>

      <div className="hf-body">
        <div className="hf-row">
          <input
            className="nf-input hf-input"
            type="text"
            placeholder="e.g. gpt2, bert-base-uncased, mistralai/Mistral-7B-v0.1"
            value={modelName}
            onChange={(e) => { setModelName(e.target.value); setError(null); setSuccess(null) }}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="btn-hf-import"
            onClick={handleImport}
            disabled={loading || !modelName.trim()}
          >
            {loading ? <span className="hf-spinner" /> : 'Import'}
          </button>
        </div>


        {error && (
          <div className="hf-error" style={{ '--err-color': errMeta.color }}>
            <span className="hf-err-icon">{errMeta.icon}</span>
            <div>
              <div className="hf-err-label">{errMeta.label}</div>
              <div className="hf-err-msg">{error.message}</div>
              {error.type === 'gated' && (
                <a
                  href={`https://huggingface.co/${modelName.trim()}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hf-err-link"
                >
                  Request access on HuggingFace ↗
                </a>
              )}
            </div>
          </div>
        )}

    
        {success && (
          <div className="hf-success">
            <span>✓</span>
            <div>
              <div className="hf-succ-name">{success.name}</div>
              <div className="hf-succ-info">{success.arch} · {success.info}</div>
            </div>
          </div>
        )}

        <div className="hf-examples">
          {['gpt2', 'bert-base-uncased', 'distilbert-base-uncased'].map(ex => (
            <button
              key={ex}
              className="hf-example-btn"
              onClick={() => { setModelName(ex); setError(null); setSuccess(null) }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .hf-wrap { overflow: hidden; }
        .hf-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px 0;
        }
        .hf-browse-link {
          font-size: 9px;
          color: var(--nf-accent2);
          text-decoration: none;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .hf-browse-link:hover { text-decoration: underline; }
        .hf-body {
          padding: 10px 14px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .hf-row {
          display: flex;
          gap: 6px;
        }
        .hf-input { flex: 1; font-size: 10px; }
        .btn-hf-import {
          background: var(--nf-accent);
          color: #000;
          border: none;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          padding: 6px 14px;
          border-radius: 3px;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 64px;
        }
        .btn-hf-import:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-hf-import:not(:disabled):hover { opacity: 0.85; }
        .hf-spinner {
          width: 12px; height: 12px;
          border: 2px solid rgba(0,0,0,0.3);
          border-top-color: #000;
          border-radius: 50%;
          animation: hf-spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes hf-spin { to { transform: rotate(360deg); } }

        .hf-error {
          display: flex;
          gap: 8px;
          background: rgba(255,61,106,0.06);
          border: 1px solid color-mix(in srgb, var(--err-color) 30%, transparent);
          border-radius: 3px;
          padding: 8px 10px;
          font-size: 10px;
        }
        .hf-err-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
        .hf-err-label {
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--err-color);
          margin-bottom: 2px;
          font-weight: 700;
        }
        .hf-err-msg { color: var(--nf-text); line-height: 1.5; }
        .hf-err-link {
          display: inline-block;
          margin-top: 4px;
          color: var(--nf-accent2);
          font-size: 9px;
          text-decoration: none;
          letter-spacing: 0.06em;
        }
        .hf-err-link:hover { text-decoration: underline; }

        .hf-success {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          background: rgba(0,229,160,0.06);
          border: 1px solid rgba(0,229,160,0.2);
          border-radius: 3px;
          padding: 8px 10px;
          font-size: 10px;
          color: var(--nf-accent);
        }
        .hf-succ-name { font-weight: 700; font-size: 10px; }
        .hf-succ-info { color: var(--nf-muted); font-size: 9px; margin-top: 1px; }

        .hf-examples {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .hf-example-btn {
          background: var(--nf-surface2);
          border: 1px solid var(--nf-border);
          color: var(--nf-muted);
          font-family: 'Space Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.06em;
          padding: 3px 8px;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .hf-example-btn:hover {
          border-color: var(--nf-accent2);
          color: var(--nf-accent2);
        }
      `}</style>
    </div>
  )
}