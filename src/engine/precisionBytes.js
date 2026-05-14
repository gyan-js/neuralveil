/** these are basically the precision and GPU VRAM constants  */

export const PRECISION_BYTES = {
    fp32: 4,
    fp16: 2,
    bf16: 2,
    int8: 1,
  }
  
  export const GPU_VRAM = {
    A100: 80,
    H100: 80,
    'RTX 4090': 24,
    V100: 32,
  }
  
  export const PRECISION_LABELS = {
    fp32: 'fp32 — 4 bytes',
    fp16: 'fp16 — 2 bytes',
    bf16: 'bf16 — 2 bytes',
    int8: 'int8 — 1 byte',
  }