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

const BUILTIN_GPU_COLORS = {
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

const CUSTOM_GPU_COLOR = '#ffffff'
const BUILTIN_GPUS = Object.keys(GPU_VRAM)
const BATCH_SIZES = [1, 2, 4, 8, 16, 32, 64, 128, 256]

export default function SweepChart() {
  const sweepResults = useMemoryStore((s) => s.sweepResults)
  const layers       = useMemoryStore((s) => s.layers)
  const customGPUs   = useMemoryStore((s) => s.customGPUs)

  // Merged VRAM map: built-in + custom
  const allVramMap = useMemo(() => {
    const map = { ...GPU_VRAM }
    customGPUs.forEach(g => { map[g.name] = g.vramGB })
    return map
  }, [customGPUs])

  // Merged color resolver
  const getGPUColor = (name) => BUILTIN_GPU_COLORS[name] ?? CUSTOM_GPU_COLOR

  // All GPU names: built-ins first, then custom
  const allGPUNames = useMemo(() => [
    ...BUILTIN_GPUS,
    ...customGPUs.map(g => g.name),
  ], [customGPUs])

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

    const gpuDatasets = allGPUNames.filter(n => visibleGPUs.has(n)).map(name => {
      const isCustom = !BUILTIN_GPU_COLORS[name]
      const color = getGPUColor(name)
      return {
        label: name,
        data: BATCH_SIZES.map(() => allVramMap[name]),
        borderColor: color,
        backgroundColor: 'transparent',
        borderWidth: isCustom ? 2 : 1,
        borderDash: isCustom ? [] : [4, 3],
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0,
      }
    })

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
              const vram = allVramMap[name]
              const required = ctx.chart.data.datasets[0].data[ctx.dataIndex]
              const fits = required <= vram
              return ` ${name}: ${fits ? '✓' : '✗'} ${vram}GB`
            },
            labelColor: (ctx) => {
              const color = ctx.dataset.label === 'Required VRAM'
                ? 'rgb(0,229,160)'
                : getGPUColor(ctx.dataset.label)
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
  }, [sweepResults, visibleGPUs, allGPUNames, allVramMap])

  if (!layers.length) {
    return (
      <div className="sweep-wrap">
        <div className="sweep-header">
          
        </div>
        <div className="text-[11px] ">Add layers to see VRAM vs batch size</div>
      </div>
    )
  }

  return (
    <div className="sweep-wrap">
      <div className="sweep-header">
       
        <span className="sweep-hint">Points above a line = OOM</span>
      </div>

      <div className="sweep-gpu-toggles">
        {allGPUNames.map(name => {
          const isCustom = !BUILTIN_GPU_COLORS[name]
          const color = getGPUColor(name)
          return (
            <button
              key={name}
              className={`sweep-gpu-btn ${visibleGPUs.has(name) ? 'active' : ''}`}
              style={{ '--gpu-color': color }}
              onClick={() => toggleGPU(name)}
            >
              {name}
              {isCustom && <span className="sweep-custom-badge">C</span>}
            </button>
          )
        })}
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
          font-size: 5px;
          color: var(--nf-muted);
          text-align: center;
          padding: 20px;
          display: none;
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
        .sweep-custom-badge {
          display: inline-block;
          margin-left: 4px;
          font-size: 7px;
          letter-spacing: 0.05em;
          border: 1px solid currentColor;
          border-radius: 2px;
          padding: 0 3px;
          opacity: 0.8;
          vertical-align: middle;
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