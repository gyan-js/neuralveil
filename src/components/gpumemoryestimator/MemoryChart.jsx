import React, { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import useMemoryStore from '../../store/useMemoryStore.js'
import '../../styles/gpu.css'
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const COLORS = {
  weights: '#3266ad',
  activations: '#0ea5e9',
  gradients: '#f97316',
  optimizer: '#ef4444',
}

const LEGEND_ITEMS = [
  { key: 'weights', label: 'Weights', color: COLORS.weights, trainingOnly: false },
  { key: 'activations', label: 'Activations', color: COLORS.activations, trainingOnly: false },
  { key: 'gradients', label: 'Gradients', color: COLORS.gradients, trainingOnly: true },
  { key: 'optimizer', label: 'Optimizer State', color: COLORS.optimizer, trainingOnly: true },
]

export default function MemoryChart() {
  const layers = useMemoryStore((s) => s.layers)
  const results = useMemoryStore((s) => s.results)
  const mode = useMemoryStore((s) => s.mode)

  const isTraining = mode === 'training'

  const { chartData, options } = useMemo(() => {
    if (!results || layers.length === 0) {
      return {
        chartData: { labels: ['No layers'], datasets: [{ label: 'Empty', data: [0], backgroundColor: COLORS.weights }] },
        options: {},
      }
    }

    const { weights, activations, totals } = results
    const labels = layers.map((l, i) => `${i + 1}:${l.type.slice(0, 5)}`)

    const gradShare = isTraining ? totals.gradientsGB / layers.length : 0
    const optShare = isTraining ? totals.optimizerGB / layers.length : 0

    const datasets = [
      {
        label: 'Weights',
        data: weights.perLayer.map((l) => +l.memGB.toFixed(5)),
        backgroundColor: COLORS.weights,
        stack: 'memory',
      },
      {
        label: 'Activations',
        data: activations.perLayer.map((l) => +l.memGB.toFixed(5)),
        backgroundColor: COLORS.activations,
        stack: 'memory',
      },
    ]

    if (isTraining) {
      datasets.push({
        label: 'Gradients',
        data: layers.map(() => +gradShare.toFixed(5)),
        backgroundColor: COLORS.gradients,
        stack: 'memory',
      })
      datasets.push({
        label: 'Optimizer State',
        data: layers.map(() => +optShare.toFixed(5)),
        backgroundColor: COLORS.optimizer,
        stack: 'memory',
      })
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
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
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw.toFixed(5)} GB`,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            color: '#6b7280',
            font: { family: 'Space Mono', size: 9 },
            maxRotation: 45,
            autoSkip: layers.length > 20,
          },
          grid: { color: 'rgba(255,255,255,0.04)' },
          border: { color: 'rgba(255,255,255,0.08)' },
        },
        y: {
          stacked: true,
          ticks: {
            color: '#6b7280',
            font: { family: 'Space Mono', size: 9 },
            callback: (v) => v.toFixed(2) + ' GB',
          },
          grid: { color: 'rgba(255,255,255,0.06)' },
          border: { color: 'rgba(255,255,255,0.08)' },
        },
      },
    }

    return { chartData: { labels, datasets }, options }
  }, [results, layers, isTraining])

  return (
    <div className="memory-chart">
      <div className="mc-legend">
        {LEGEND_ITEMS.filter((item) => !item.trainingOnly || isTraining).map((item) => (
          <div key={item.key} className="mc-legend-item">
            <div className="mc-legend-dot" style={{ background: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'relative', width: '100%', height: '200px' }}>
        <Bar
          data={chartData}
          options={options}
          aria-label="Stacked bar chart showing VRAM breakdown by layer and component"
        />
      </div>
      <style>{`
        .memory-chart { padding: 14px 16px; }
        .mc-legend {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .mc-legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          color: var(--nf-muted);
        }
        .mc-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 1px;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
}