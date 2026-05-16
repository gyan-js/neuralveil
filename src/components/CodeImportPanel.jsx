import { useState, useCallback, useRef, useEffect } from 'react'
import { useGraphStore } from '../store/useGraphStore.js'
import { X, Code2, Upload, AlertTriangle, CheckCircle2, Zap, ChevronRight } from 'lucide-react'



function FrameworkBadge({ framework }) {
  if (!framework) return null

  const isPyTorch = framework === 'pytorch'
  const isTF      = framework === 'tensorflow'
  if (!isPyTorch && !isTF) return null

  const color  = isPyTorch ? '#EF4444' : '#F59E0B'
  const label  = isPyTorch ? 'PyTorch detected' : 'TensorFlow / Keras detected'
  const icon   = isPyTorch ? '🔥' : '🟡'

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px',
      background: `${color}12`,
      border: `1px solid ${color}35`,
      borderRadius: 20,
      fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 600,
      color,
      letterSpacing: '0.06em',
      animation: 'fadeInBadge 0.25s ease-out',
    }}>
      <span>{icon}</span>
      {label}
    </div>
  )
}



function ErrorCard({ errors }) {
  if (!errors || errors.length === 0) return null
  return (
    <div style={{
      background: 'rgba(255,107,53,0.07)',
      border: '1px solid rgba(255,107,53,0.25)',
      borderRadius: 8, padding: '10px 12px', marginTop: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <AlertTriangle size={11} color="#FF6B35" />
        <span style={{ fontFamily: 'Syne', fontSize: 9, color: '#FF6B35', fontWeight: 700, letterSpacing: '0.1em' }}>
          PARSE ERRORS
        </span>
      </div>
      {errors.map((err, i) => (
        <div key={i} style={{
          fontFamily: 'JetBrains Mono', fontSize: 9, color: '#FF6B35',
          lineHeight: 1.6, opacity: 0.85,
          marginBottom: i < errors.length - 1 ? 4 : 0,
        }}>
          • {err}
        </div>
      ))}
    </div>
  )
}

function WarningCard({ warnings }) {
  if (!warnings || warnings.length === 0) return null
  return (
    <div style={{
      background: 'rgba(255,215,0,0.06)',
      border: '1px solid rgba(255,215,0,0.2)',
      borderRadius: 8, padding: '10px 12px', marginTop: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <AlertTriangle size={11} color="#FFD700" />
        <span style={{ fontFamily: 'Syne', fontSize: 9, color: '#FFD700', fontWeight: 700, letterSpacing: '0.1em' }}>
          WARNINGS ({warnings.length})
        </span>
      </div>
      {warnings.map((w, i) => (
        <div key={i} style={{
          fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(255,215,0,0.75)',
          lineHeight: 1.6,
          marginBottom: i < warnings.length - 1 ? 4 : 0,
        }}>
          • {w}
        </div>
      ))}
    </div>
  )
}
const EXAMPLES = [
    {
      label: 'VGG-style CNN',
      fw: 'pytorch',
      code: `import torch
  import torch.nn as nn
  
  class VGGBlock(nn.Module):
      def __init__(self):
          super().__init__()
          self.conv1 = nn.Conv2d(3, 64, kernel_size=3, padding=1)
          self.conv2 = nn.Conv2d(64, 64, kernel_size=3, padding=1)
          self.pool1 = nn.MaxPool2d(kernel_size=2, stride=2)
          self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
          self.pool2 = nn.MaxPool2d(kernel_size=2, stride=2)
          self.flatten = nn.Flatten()
          self.fc1 = nn.Linear(128, 512)
          self.drop = nn.Dropout(p=0.5)
          self.fc2 = nn.Linear(512, 10)
  
      def forward(self, x):
          x = self.conv1(x)
          x = self.conv2(x)
          x = self.pool1(x)
          x = self.conv3(x)
          x = self.pool2(x)
          x = self.flatten(x)
          x = self.fc1(x)
          x = self.drop(x)
          x = self.fc2(x)
          return x`,
    },
    {
      label: 'ResNet Skip Connection',
      fw: 'pytorch',
      code: `import torch
  import torch.nn as nn
  
  class ResBlock(nn.Module):
      def __init__(self):
          super().__init__()
          self.conv1 = nn.Conv2d(64, 64, kernel_size=3, padding=1)
          self.bn1   = nn.BatchNorm2d(64)
          self.conv2 = nn.Conv2d(64, 64, kernel_size=3, padding=1)
          self.bn2   = nn.BatchNorm2d(64)
  
      def forward(self, x):
          identity = x
          out = self.conv1(x)
          out = self.bn1(out)
          out = self.conv2(out)
          out = self.bn2(out)
          out = out + identity   # skip connection → Merge (ADD)
          return out`,
    },
    {
      label: 'Transformer Block',
      fw: 'pytorch',
      code: `import torch
  import torch.nn as nn
  
  class TransformerBlock(nn.Module):
      def __init__(self):
          super().__init__()
          self.embed = nn.Embedding(10000, 512)
          self.attn = nn.MultiheadAttention(embed_dim=512, num_heads=8, dropout=0.1, batch_first=True)
          self.ln1 = nn.LayerNorm([512])
          self.fc1 = nn.Linear(512, 2048)
          self.drop = nn.Dropout(p=0.1)
          self.fc2 = nn.Linear(2048, 512)
          self.ln2 = nn.LayerNorm([512])
  
      def forward(self, x):
          x = self.embed(x)
          x, _ = self.attn(x, x, x)
          x = self.ln1(x)
          x = self.fc1(x)
          x = self.drop(x)
          x = self.fc2(x)
          x = self.ln2(x)
          return x`,
    },
    {
      label: 'GRU Sequence Model',
      fw: 'pytorch',
      code: `import torch
  import torch.nn as nn
  
  class GRUClassifier(nn.Module):
      def __init__(self):
          super().__init__()
          self.embed = nn.Embedding(8000, 128)
          self.gru   = nn.GRU(input_size=128, hidden_size=256,
                              num_layers=2, batch_first=True,
                              bidirectional=True, dropout=0.3)
          self.drop  = nn.Dropout(p=0.3)
          self.fc    = nn.Linear(512, 10)   # 256 * 2 for bidirectional
  
      def forward(self, x):
          x = self.embed(x)
          x, _ = self.gru(x)
          x = x[:, -1, :]   # last timestep
          x = self.drop(x)
          x = self.fc(x)
          return x`,
    },
    {
      label: 'Keras Sequential',
      fw: 'tensorflow',
      code: `import tensorflow as tf
  from tensorflow.keras import layers, Model
  
  inputs = tf.keras.Input(shape=(224, 224, 3))
  x1 = layers.Conv2D(32, kernel_size=3, strides=1, padding='same', activation='relu')(inputs)
  p1 = layers.MaxPooling2D(pool_size=2, strides=2)(x1)
  x2 = layers.Conv2D(64, kernel_size=3, padding='same', activation='relu')(p1)
  p2 = layers.MaxPooling2D(pool_size=2, strides=2)(x2)
  bn1 = layers.BatchNormalization()(p2)
  flat = layers.Flatten()(bn1)
  d1 = layers.Dense(256, activation='relu')(flat)
  drop1 = layers.Dropout(0.5)(d1)
  d2 = layers.Dense(10)(drop1)
  
  model = Model(inputs=inputs, outputs=d2)`,
    },
  ]
export default function CodeImportPanel() {
  const showCodeImport   = useGraphStore(s => s.showCodeImport)
  const closeCodeImport  = useGraphStore(s => s.closeCodeImport)
  const importFromCode   = useGraphStore(s => s.importFromCode)
  const detectFwLive     = useGraphStore(s => s.detectFrameworkLive)
  const importErrors     = useGraphStore(s => s.importErrors)
  const importWarnings   = useGraphStore(s => s.importWarnings)
  const importFramework  = useGraphStore(s => s.importFramework)

  const [code, setCode]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [charCount, setCharCount] = useState(0)
  const textareaRef             = useRef(null)
  const detectTimer             = useRef(null)

 
  useEffect(() => {
    if (showCodeImport && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 150)
    }
  }, [showCodeImport])

  const handleCodeChange = useCallback((e) => {
    const val = e.target.value
    setCode(val)
    setCharCount(val.length)

 
    clearTimeout(detectTimer.current)
    detectTimer.current = setTimeout(() => {
      if (val.trim().length > 20) detectFwLive(val)
    }, 300)
  }, [detectFwLive])

  const handleImport = useCallback(async () => {
    if (!code.trim() || loading) return
    setLoading(true)
    try {
      await importFromCode(code)
    } finally {
      setLoading(false)
    }
  }, [code, loading, importFromCode])

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleImport()
    }
    if (e.key === 'Escape') closeCodeImport()
  }, [handleImport, closeCodeImport])

  const loadExample = (ex) => {
    setCode(ex.code)
    setCharCount(ex.code.length)
    detectFwLive(ex.code)
    textareaRef.current?.focus()
  }

  const clearCode = () => {
    setCode('')
    setCharCount(0)
    textareaRef.current?.focus()
  }

  const panelStyle = {
    position: 'fixed',
    top: 0, right: 0, bottom: 0,
    width: 520,
    background: '#080C14',
    borderLeft: '1px solid rgba(0,229,255,0.12)',
    display: 'flex', flexDirection: 'column',
    zIndex: 500,
    transform: showCodeImport ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: showCodeImport ? '-20px 0 60px rgba(0,0,0,0.6)' : 'none',
  }

  return (
    <>
      {/* Backdrop */}
      {showCodeImport && (
        <div
          onClick={closeCodeImport}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 499,
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      <div style={panelStyle} onKeyDown={handleKeyDown}>

        {/* ── HEADER ── */}
        <div style={{
          padding: '16px 18px 14px',
          borderBottom: '1px solid rgba(0,229,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30,
              background: 'rgba(0,229,255,0.08)',
              border: '1px solid rgba(0,229,255,0.2)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Code2 size={14} color="#00E5FF" strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#fff', letterSpacing: '0.03em' }}>
                Code → Graph
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8.5, color: 'rgba(0,229,255,0.4)', marginTop: 1 }}>
                PyTorch · TensorFlow · Keras
              </div>
            </div>
          </div>
          <button onClick={closeCodeImport} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={15} color="rgba(255,255,255,0.3)" />
          </button>
        </div>

    
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

         
          <div style={{
            fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(255,255,255,0.3)',
            lineHeight: 1.7,
            background: 'rgba(0,229,255,0.03)',
            border: '1px solid rgba(0,229,255,0.07)',
            borderRadius: 7, padding: '9px 11px',
          }}>
            Paste a PyTorch <span style={{ color: 'rgba(0,229,255,0.6)' }}>nn.Module</span> or Keras{' '}
            <span style={{ color: 'rgba(0,229,255,0.6)' }}>Functional API</span> model definition.
            The parser performs static analysis — no Python execution required.
          </div>

       
          <div style={{ minHeight: 24, display: 'flex', alignItems: 'center' }}>
            {importFramework
              ? <FrameworkBadge framework={importFramework} />
              : code.trim().length > 10
                ? <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(255,255,255,0.18)' }}>
                    detecting framework…
                  </span>
                : null
            }
          </div>

        
          <div style={{ position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={handleCodeChange}
              placeholder={`# Paste your model code here
# Example:
import torch.nn as nn

class MyModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 64, kernel_size=3)
        self.fc1 = nn.Linear(64, 10)
    
    def forward(self, x):
        x = self.conv1(x)
        return self.fc1(x)`}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              style={{
                width: '100%',
                height: 280,
                background: '#050810',
                border: '1px solid rgba(0,229,255,0.12)',
                borderRadius: 8,
                color: '#a8c4d4',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.72rem',
                lineHeight: 1.65,
                padding: '12px 14px',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                caretColor: '#00E5FF',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(0,229,255,0.35)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(0,229,255,0.12)' }}
            />
            {/* Char count + clear */}
            <div style={{
              position: 'absolute', bottom: 8, right: 10,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {code.length > 0 && (
                <button onClick={clearCode} style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.3)', fontFamily: 'Syne', fontSize: 8,
                  padding: '2px 7px', borderRadius: 4, cursor: 'pointer',
                  letterSpacing: '0.06em',
                }}>
                  CLEAR
                </button>
              )}
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>
                {charCount.toLocaleString()} chars
              </span>
            </div>
          </div>

       
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#fff', textAlign: 'right', marginTop: -8 }}>
            ⌘↩ / Ctrl+Enter to import
          </div>

          <ErrorCard errors={importErrors} />
          <WarningCard warnings={importWarnings} />

      
          <div>
            <div style={{
              fontFamily: 'Syne', fontSize: 9, color: 'rgba(0,229,255,0.4)',
              letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8,
            }}>
              Quick Examples
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => loadExample(ex)}
                  style={{
                    background: 'rgba(0,229,255,0.03)',
                    border: '1px solid rgba(0,229,255,0.08)',
                    borderRadius: 7, padding: '8px 12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    width: '100%', textAlign: 'left',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(0,229,255,0.2)'
                    e.currentTarget.style.background = 'rgba(0,229,255,0.06)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(0,229,255,0.08)'
                    e.currentTarget.style.background = 'rgba(0,229,255,0.03)'
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'Syne', fontSize: 11, color: '#fff', fontWeight: 600, marginBottom: 2 }}>
                      {ex.label}
                    </div>
                    <div style={{
                      fontFamily: 'JetBrains Mono', fontSize: 8,
                      color: ex.fw === 'pytorch' ? 'rgba(239,68,68,0.6)' : 'rgba(245,158,11,0.6)',
                      letterSpacing: '0.06em',
                    }}>
                      {ex.fw === 'pytorch' ? '🔥 PyTorch' : '🟡 TensorFlow/Keras'}
                    </div>
                  </div>
                  <ChevronRight size={12} color="rgba(0,229,255,0.3)" />
                </button>
              ))}
            </div>
          </div>

      
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 7, padding: '10px 12px',
          }}>
            <div style={{
              fontFamily: 'Syne', fontSize: 9, color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.1em', marginBottom: 6,
            }}>
              PARSER NOTES
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8.5, color: 'rgba(255,255,255,0.2)', lineHeight: 1.7 }}>
              • Custom classes and Lambda layers → Unknown (warning shown)<br />
              • Variable references in args → placeholder value (warning shown)<br />
              • Activation-only layers (ReLU, Softmax, etc.) → skipped<br />
              • Skip connections traced via DAG analysis → Merge node inserted<br />
              • Unsupported layers do not block import
            </div>
          </div>
        </div>

       
        <div style={{
          padding: '14px 18px',
          borderTop: '1px solid rgba(0,229,255,0.07)',
          flexShrink: 0,
        }}>
          <button
            onClick={handleImport}
            disabled={!code.trim() || loading}
            style={{
              width: '100%',
              padding: '11px 0',
              background: code.trim() && !loading
                ? 'rgba(0,229,255,0.1)'
                : 'rgba(0,229,255,0.03)',
              border: `1px solid ${code.trim() && !loading ? 'rgba(0,229,255,0.5)' : 'rgba(0,229,255,0.15)'}`,
              borderRadius: 8,
              color: code.trim() && !loading ? '#00E5FF' : 'rgba(0,229,255,0.3)',
              fontFamily: 'Syne', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              cursor: code.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s ease',
              boxShadow: code.trim() && !loading ? '0 0 20px rgba(0,229,255,0.08)' : 'none',
            }}
            onMouseEnter={e => {
              if (!code.trim() || loading) return
              e.currentTarget.style.background = 'rgba(0,229,255,0.15)'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(0,229,255,0.15)'
            }}
            onMouseLeave={e => {
              if (!code.trim() || loading) return
              e.currentTarget.style.background = 'rgba(0,229,255,0.1)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0,229,255,0.08)'
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 12, height: 12,
                  border: '2px solid rgba(0,229,255,0.3)',
                  borderTopColor: '#00E5FF',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Parsing…
              </>
            ) : (
              <>
                <Upload size={13} strokeWidth={2} />
                Import Graph
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInBadge {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}