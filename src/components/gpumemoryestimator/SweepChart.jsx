import React, { useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import useMemoryStore from '../../store/useMemoryStore.js'
import { GPU_VRAM } from '../../engine/precisionBytes.js'
import '../../styles/gpu.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const GPU_COLORS = {
  'RTX 3080': '#6b7280',
  'RTX 3090': '#8b5cf6',
  'RTX 4080': '#06b6d4',
  'RTX 4090': '#00e5a0',
  'A10G':     '#f59e0b',
  'V100':     '#3b82f6',
  'A100':     '#f97316',
  'H100':     '#ef4444',
  'H200':     '#ec4899',
}

const ALL_GPUS = Object.keys(GPU_VRAM)
const BATCH_SIZES = [1, 2, 4, 8, 16, 32, 64, 128, 256]

export default function SweepChart() {
  const sweepResults = useMemoryStore((s) => s.sweepResults)
  const layers       = useMemoryStore((s) => s.layers)

  const [visibleGPUs, setVisibleGPUs] = useState(
    new Set(['RTX 4090', 'A100', 'H100'])
  )

  function toggleGPU(name) {
    setVisibleGPUs(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const { chartData, options } = useMemo(() => {
    const labels = BATCH_SIZES.map(String)
    const requiredData = sweepResults.map(r => r?.totalGB ?? 0)

    const gpuDatasets = ALL_GPUS.filter(n => visibleGPUs.has(n)).map(name => ({
      label: name,
      data: BATCH_SIZES.map(() => GPU_VRAM[name]),
      borderColor: GPU_COLORS[name],
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderDash: [4, 3],
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0,
    }))

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Required VRAM',
          data: requiredData,
          borderColor: 'rgb(0,229,160)',
          backgroundColor: 'rgba(0,229,160,0.08)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: 'rgb(0,229,160)',
          pointBorderWidth: 0,
          pointHoverRadius: 5,
          tension: 0.3,
          fill: false,
          order: 0,
        },
        ...gpuDatasets,
      ],
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#111318',
          borderColor: 'rgba(255,255,255,0.12)',
          borderWidth: 1,
          titleColor: '#00e5a0',
          bodyColor: '#e8eaf0',
          titleFont: { family: 'Space Mono', size: 11 },
          bodyFont: { family: 'Space Mono', size: 10 },
          padding: 10,
          callbacks: {
            title: (items) => `Batch size: ${items[0].label}`,
            label: (ctx) => {
              if (ctx.dataset.label === 'Required VRAM') {
                return ` Required: ${ctx.raw.toFixed(3)} GB`
              }
              const name = ctx.dataset.label
              const required = ctx.chart.data.datasets[0].data[ctx.dataIndex]
              const fits = required <= GPU_VRAM[name]
              return ` ${name}: ${fits ? '✓' : '✗'} ${GPU_VRAM[name]}GB`
            },
            labelColor: (ctx) => {
              const color = ctx.dataset.label === 'Required VRAM'
                ? 'rgb(0,229,160)'
                : GPU_COLORS[ctx.dataset.label]
              return { borderColor: color, backgroundColor: color }
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#6b7280', font: { family: 'Space Mono', size: 9 } },
          grid: { color: 'rgba(255,255,255,0.04)' },
          border: { color: 'rgba(255,255,255,0.08)' },
          title: { display: true, text: 'batch size', color: '#6b7280', font: { family: 'Space Mono', size: 9 } },
        },
        y: {
          ticks: { color: '#6b7280', font: { family: 'Space Mono', size: 9 }, callback: (v) => `${v.toFixed(0)}GB` },
          grid: { color: 'rgba(255,255,255,0.06)' },
          border: { color: 'rgba(255,255,255,0.08)' },
          title: { display: true, text: 'VRAM (GB)', color: '#6b7280', font: { family: 'Space Mono', size: 9 } },
        },
      },
    }

    return { chartData, options }
  }, [sweepResults, visibleGPUs])

  if (!layers.length) {
    return (
      <div className="sweep-wrap">
        <div className="sweep-header">
          <span className="panel-label" style={{ marginBottom: 0 }}>// Batch Size Sweep</span>
        </div>
        <div className="sweep-empty">Add layers to see VRAM vs batch size</div>
      </div>
    )
  }

  return (
    <div className="sweep-wrap">
      <div className="sweep-header">
        <span className="panel-label" style={{ marginBottom: 0 }}>// Batch Size Sweep</span>
        <span className="sweep-hint">Points above a line = OOM</span>
      </div>

      <div className="sweep-gpu-toggles">
        {ALL_GPUS.map(name => (
          <button
            key={name}
            className={`sweep-gpu-btn ${visibleGPUs.has(name) ? 'active' : ''}`}
            style={{ '--gpu-color': GPU_COLORS[name] }}
            onClick={() => toggleGPU(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', width: '100%', height: '220px', padding: '0 14px 14px' }}>
        <Line
          data={chartData}
          options={options}
          aria-label="Line chart showing required VRAM vs batch size with GPU capacity reference lines"
        />
      </div>

      <style>{`
        .sweep-wrap { overflow: hidden; }
        .sweep-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px 8px;
          border-bottom: 1px solid var(--nf-border);
        }
        .sweep-hint {
          font-size: 9px;
          color: var(--nf-muted);
          letter-spacing: 0.05em;
        }
        .sweep-empty {
          font-size: 11px;
          color: var(--nf-muted);
          text-align: center;
          padding: 20px;
        }
        .sweep-gpu-toggles {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          padding: 8px 14px;
        }
        .sweep-gpu-btn {
          background: transparent;
          border: 1px solid var(--nf-border2);
          color: var(--nf-muted);
          font-family: 'Space Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.06em;
          padding: 3px 7px;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .sweep-gpu-btn.active {
          border-color: var(--gpu-color);
          color: var(--gpu-color);
          background: color-mix(in srgb, var(--gpu-color) 10%, transparent);
        }
        .sweep-tooltip {
          background: #111318;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 4px;
          padding: 8px 10px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          min-width: 150px;
        }
        .st-title {
          color: var(--nf-muted);
          font-size: 9px;
          letter-spacing: 0.1em;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        .st-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 1px 0;
          font-size: 9px;
        }
        .st-divider {
          height: 1px;
          background: rgba(255,255,255,0.08);
          margin: 4px 0;
        }
      `}</style>
    </div>
  )
}