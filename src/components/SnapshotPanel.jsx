import { useState, useRef, useCallback } from 'react'
import { useGraphStore } from '../store/useGraphStore.js'
import { Camera, GitCompare, Trash2, Download, Upload, X, Clock, Layers, ChevronRight, AlertTriangle } from 'lucide-react'

function formatTimestamp(ts) {
  const d = new Date(ts)
  const now = Date.now()
  const diff = now - ts

  if (diff < 60_000)  return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`

  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function layerCount(snapshot) {
  return (snapshot.nodes ?? []).filter(n => n.data?.layerType !== 'Input' && n.type !== 'inputNode').length
}



function SnapshotCard({ snapshot, isSelected, selectionOrder, onSelect, onDelete, onRestore }) {
  const [hovered, setHovered] = useState(false)
  const count = layerCount(snapshot)

  const selectionColor =
    selectionOrder === 1 ? '#FF6B35' :   
    selectionOrder === 2 ? '#00E5FF' :  
    null

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(snapshot.id)}
      style={{
        position: 'relative',
        background: isSelected
          ? `${selectionColor}12`
          : hovered ? 'rgba(0,229,255,0.04)' : 'rgba(13,21,38,0.6)',
        border: `1px solid ${
          isSelected ? `${selectionColor}50` : hovered
            ? 'rgba(0,229,255,0.2)' : 'rgba(0,229,255,0.08)'
        }`,
        borderRadius: 8,
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        marginBottom: 6,
        userSelect: 'none',
      }}
    >
      {/* Selection order badge */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: -8, right: 10,
          background: selectionColor,
          color: '#000',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          fontWeight: 700,
          padding: '1px 7px',
          borderRadius: 4,
          letterSpacing: '0.08em',
        }}>
          {selectionOrder === 1 ? 'BASE' : 'TARGET'}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name */}
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 12,
            color: isSelected ? selectionColor : 'rgba(255,255,255,0.85)',
            letterSpacing: '0.03em',
            marginBottom: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color 0.15s',
          }}>
            {snapshot.name}
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={9} color="rgba(255,255,255,0.3)" />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: 'rgba(255,255,255,0.5)',
              }}>
                {formatTimestamp(snapshot.timestamp)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Layers size={9} color="rgba(255,255,255,0.3)" />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: 'rgba(255,255,255,0.5)',
              }}>
                {count} layer{count !== 1 ? 's' : ''}
              </span>
            </div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: 'rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.05)',
              padding: '1px 5px',
              borderRadius: 3,
            }}>
              {snapshot.format}
            </span>
          </div>
        </div>

        {/* Action buttons (shown on hover) */}
        <div style={{
          display: 'flex',
          gap: 4,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s',
          flexShrink: 0,
          marginLeft: 8,
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); onRestore(snapshot.id) }}
            title="Load this snapshot onto the canvas"
            style={iconBtnStyle('#39FF14')}
          >
            <ChevronRight size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(snapshot.id) }}
            title="Delete snapshot"
            style={iconBtnStyle('#FF6B35')}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}

function iconBtnStyle(color) {
  return {
    background: `${color}10`,
    border: `1px solid ${color}30`,
    borderRadius: 5,
    color,
    cursor: 'pointer',
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    transition: 'background 0.15s, border-color 0.15s',
    flexShrink: 0,
  }
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function SnapshotPanel({ onClose }) {
  const snapshots          = useGraphStore(s => s.snapshots)
  const saveSnapshot       = useGraphStore(s => s.saveSnapshot)
  const deleteSnapshot     = useGraphStore(s => s.deleteSnapshot)
  const restoreSnapshot    = useGraphStore(s => s.restoreSnapshot)
  const exportSnapshots    = useGraphStore(s => s.exportSnapshots)
  const importSnapshots    = useGraphStore(s => s.importSnapshots)
  const setDiff            = useGraphStore(s => s.setDiff)
  const diffMode           = useGraphStore(s => s.diffMode)
  const diffBaseId         = useGraphStore(s => s.diffBaseId)
  const diffTargetId       = useGraphStore(s => s.diffTargetId)
  const snapshotStorageWarning = useGraphStore(s => s.snapshotStorageWarning)

  const [nameInput, setNameInput] = useState('')
  const [selectedIds, setSelectedIds] = useState([]) // up to 2 ids for comparison
  const importRef = useRef(null)

  // Keep selection in sync with active diff
  const effectiveSelected = diffMode
    ? [diffBaseId, diffTargetId].filter(Boolean)
    : selectedIds

  const handleSave = useCallback(() => {
    const name = nameInput.trim() || `v${snapshots.length + 1}`
    saveSnapshot(name)
    setNameInput('')
  }, [nameInput, snapshots.length, saveSnapshot])

  const handleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 2)  return [prev[1], id]
      return [...prev, id]
    })
  }, [])

  const handleCompare = useCallback(() => {
    if (selectedIds.length !== 2) return
    setDiff(selectedIds[0], selectedIds[1])
  }, [selectedIds, setDiff])

  const handleImportFile = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (Array.isArray(data)) importSnapshots(data)
        else console.error('[NeuralVeil] Invalid .neuralveil file format')
      } catch {
        console.error('[NeuralVeil] Failed to parse import file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [importSnapshots])

  const canCompare = selectedIds.length === 2

  return (
    <div style={{
      width: 300,
      height: '100%',
      background: '#080f1e',
      borderRight: '1px solid rgba(0,229,255,0.1)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Syne', sans-serif",
      position: 'relative',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid rgba(0,229,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2,
          }}>
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, color: 'rgba(0,229,255,0.4)',
            letterSpacing: '0.12em',
          }}>
            {snapshots.length} / 20 SNAPSHOTS
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none',
          color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
          padding: 4, display: 'flex', alignItems: 'center',
        }}>
          <X size={14} />
        </button>
      </div>

      {/* ── Storage warning ── */}
      {snapshotStorageWarning && (
        <div style={{
          margin: '8px 12px 0',
          padding: '7px 10px',
          background: 'rgba(255,225,85,0.07)',
          border: '1px solid rgba(255,225,85,0.25)',
          borderRadius: 6,
          display: 'flex', alignItems: 'center', gap: 7,
          flexShrink: 0,
        }}>
          <AlertTriangle size={10} color="#FFE155" />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, color: '#FFE155',
          }}>
            Approaching 20-snapshot limit
          </span>
        </div>
      )}

      {/* ── Save new snapshot ── */}
      <div style={{
        padding: '12px 12px 10px',
        borderBottom: '1px solid rgba(0,229,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 8, color: 'rgba(255,255,255,0.25)',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          marginBottom: 7, fontFamily: "'JetBrains Mono', monospace",
        }}>
          // save snapshot
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder={`v${snapshots.length + 1} — e.g. "ResNet baseline"`}
            style={{
              flex: 1,
              background: 'rgba(0,229,255,0.04)',
              border: '1px solid rgba(0,229,255,0.15)',
              borderRadius: 5,
              color: 'rgba(255,255,255,0.8)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              padding: '5px 9px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSave}
            disabled={snapshots.length >= 20}
            title="Save current graph as snapshot"
            style={{
              background: snapshots.length >= 20
                ? 'rgba(0,229,255,0.04)'
                : 'rgba(0,229,255,0.1)',
              border: `1px solid ${snapshots.length >= 20
                ? 'rgba(0,229,255,0.1)'
                : 'rgba(0,229,255,0.3)'}`,
              borderRadius: 5,
              color: snapshots.length >= 20 ? 'rgba(255,255,255,0.2)' : '#00E5FF',
              cursor: snapshots.length >= 20 ? 'not-allowed' : 'pointer',
              padding: '0 10px',
              height: 30,
              display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
            }}
          >
            <Camera size={10} />
            SAVE
          </button>
        </div>
      </div>

      {/* ── Compare bar ── */}
      {selectedIds.length > 0 && !diffMode && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(0,229,255,0.03)',
          borderBottom: '1px solid rgba(0,229,255,0.08)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9, color: 'rgba(255,255,255,0.4)',
            }}>
              {selectedIds.length === 1
                ? 'Select one more to compare'
                : 'Ready to diff →'}
            </div>
            <button
              onClick={handleCompare}
              disabled={!canCompare}
              style={{
                background: canCompare ? 'rgba(0,229,255,0.12)' : 'transparent',
                border: `1px solid ${canCompare ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 5,
                color: canCompare ? '#00E5FF' : 'rgba(255,255,255,0.2)',
                cursor: canCompare ? 'pointer' : 'not-allowed',
                padding: '4px 10px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <GitCompare size={10} />
              DIFF
            </button>
          </div>
          {selectedIds.length === 2 && (
            <div style={{
              marginTop: 5,
              display: 'flex', gap: 6, alignItems: 'center',
            }}>
              {[
                { id: selectedIds[0], label: 'BASE', color: '#FF6B35' },
                { id: selectedIds[1], label: 'TARGET', color: '#00E5FF' },
              ].map(({ id, label, color }) => {
                const snap = snapshots.find(s => s.id === id)
                return (
                  <div key={id} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: `${color}10`,
                    border: `1px solid ${color}30`,
                    borderRadius: 4,
                    padding: '2px 7px',
                  }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 8, color, fontWeight: 700,
                    }}>{label}</span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 8, color: 'rgba(255,255,255,0.5)',
                      maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {snap?.name}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Snapshot list ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 12px',
      }}>
        {snapshots.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'rgba(255,255,255,0.2)',
          }}>
            <Camera size={24} style={{ marginBottom: 10, opacity: 0.3 }} />
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              lineHeight: 1.6,
            }}>
              No snapshots yet.<br />
              Save the current graph<br />to start tracking versions.
            </div>
          </div>
        ) : (
          [...snapshots].reverse().map((snap) => {
            const selIdx = effectiveSelected.indexOf(snap.id)
            return (
              <SnapshotCard
                key={snap.id}
                snapshot={snap}
                isSelected={selIdx !== -1}
                selectionOrder={selIdx === -1 ? null : selIdx + 1}
                onSelect={diffMode ? () => {} : handleSelect}
                onDelete={deleteSnapshot}
                onRestore={restoreSnapshot}
              />
            )
          })
        )}
      </div>

      {/* ── Footer: import / export ── */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid rgba(0,229,255,0.06)',
        display: 'flex',
        gap: 6,
        flexShrink: 0,
      }}>
        <button
          onClick={exportSnapshots}
          disabled={snapshots.length === 0}
          title="Export all snapshots as .neuralveil file"
          style={{
            ...footerBtnBase,
            opacity: snapshots.length === 0 ? 0.35 : 1,
            cursor: snapshots.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <Download size={10} />
          EXPORT
        </button>
        <button
          onClick={() => importRef.current?.click()}
          title="Import .neuralveil snapshot bundle"
          style={footerBtnBase}
        >
          <Upload size={10} />
          IMPORT
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".neuralveil,.json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
      </div>
    </div>
  )
}

const footerBtnBase = {
  flex: 1,
  background: 'rgba(0,229,255,0.04)',
  border: '1px solid rgba(0,229,255,0.12)',
  borderRadius: 5,
  color: 'rgba(255,255,255,0.4)',
  cursor: 'pointer',
  padding: '5px 0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.1em',
  transition: 'all 0.15s',
}