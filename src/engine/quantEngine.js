// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Gyan Shresth
// See LICENSE file in the project root for full license text.

export const QUANT_SCHEMES = {
    fp32: {
      bytesPerParam: 4,
      memoryMultiplier: 1.0,
      accuracyNote: 'baseline',
    },
    fp16: {
      bytesPerParam: 2,
      memoryMultiplier: 0.5,
      accuracyNote: 'lossless for most models',
    },
    bf16: {
      bytesPerParam: 2,
      memoryMultiplier: 0.5,
      accuracyNote: 'better dynamic range than fp16',
    },
    int8: {
      bytesPerParam: 1,
      memoryMultiplier: 0.25,
      accuracyNote: '~0.5% accuracy drop typical',
    },
    int4_gptq: {
      bytesPerParam: 0.5,
      memoryMultiplier: 0.125,
      accuracyNote: '1–3% accuracy drop, model-dependent',
    },
    int4_awq: {
      bytesPerParam: 0.5,
      memoryMultiplier: 0.125,
      accuracyNote: 'slightly better than GPTQ at same bitwidth',
    },
    nf4_bnb: {
      bytesPerParam: 0.5,
      memoryMultiplier: 0.125,
      accuracyNote: 'bitsandbytes QLoRA default, good for fine-tuning',
    },
  }
  

  const GPU_FIT_REFERENCE = {
    'A10':   24,
    'H100':  80,
    'RTX4090': 24,
    'V100':  16,
  }

  export function calcQuantizedMemory(baseWeightsGB, scheme) {
    const s = QUANT_SCHEMES[scheme]
    if (!s) throw new Error(`Unknown scheme: ${scheme}`)
    const weightGB   = baseWeightsGB * s.memoryMultiplier
    const savedGB    = baseWeightsGB - weightGB
    const savedPercent = (savedGB / baseWeightsGB) * 100
    return { weightGB, savedGB, savedPercent, accuracyNote: s.accuracyNote }
  }
  

  export function calcQuantComparisonTable(baseWeightsGB, activationsGB, mode = 'inference') {
    const fp32WeightsGB = baseWeightsGB  // caller passes FP32 baseline
  
    return Object.entries(QUANT_SCHEMES)
      .map(([scheme, meta]) => {
        const weightGB   = fp32WeightsGB * meta.memoryMultiplier
        const savedGB    = fp32WeightsGB - weightGB
        const savedPercent = (savedGB / fp32WeightsGB) * 100
  
       
        const gradientsGB = mode === 'training' ? weightGB : 0
  
        const totalGB = weightGB + activationsGB + gradientsGB
        const gpuFit = {}
        Object.entries(GPU_FIT_REFERENCE).forEach(([gpu, vram]) => {
          gpuFit[gpu] = totalGB <= vram
        })
  
        return {
          scheme,
          weightGB: +weightGB.toFixed(3),
          totalGB:  +totalGB.toFixed(3),
          savedGB:  +savedGB.toFixed(3),
          savedPercent: +savedPercent.toFixed(1),
          gpuFit,
          accuracyNote: meta.accuracyNote,
        }
      })
      .sort((a, b) => a.totalGB - b.totalGB)
  }