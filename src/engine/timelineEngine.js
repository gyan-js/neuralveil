// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Gyan Shresth
// See LICENSE file in the project root for full license text.

export const PHASE_LABELS = [
    'Start',
    'Forward Peak',
    'After Forward',
    'Backward Peak',
    'After Optimizer',
  ]

  export function buildTimeline({ weightsGB, activationsGB, gradientsGB, optimizerGB }) {
    const w = weightsGB
    const a = activationsGB
    const g = gradientsGB
    const o = optimizerGB
  
    return [
      {
        phase: 0,
        label: PHASE_LABELS[0],
        memoryGB: parseFloat((w).toFixed(3)),
        description: 'Weights loaded into VRAM',
      },
      {
        phase: 1,
        label: PHASE_LABELS[1],
        memoryGB: parseFloat((w + a).toFixed(3)),
        description: 'Activations accumulating during forward pass',
      },
      {
        phase: 2,
        label: PHASE_LABELS[2],
        memoryGB: parseFloat((w + a + g * 0.3).toFixed(3)),
        description: 'Forward done — gradients starting to populate',
      },
      {
        phase: 3,
        label: PHASE_LABELS[3],
        memoryGB: parseFloat((w + a + g).toFixed(3)),
        description: 'Peak: full weights + activations + gradients in VRAM',
      },
      {
        phase: 4,
        label: PHASE_LABELS[4],
        memoryGB: parseFloat((w + o).toFixed(3)),
        description: 'Optimizer step done — activations freed, optimizer state held',
      },
    ]
  }