/** these are basically the precision and GPU VRAM constants  */

export const PRECISION_BYTES = {
  fp32: 4,
  fp16: 2,
  bf16: 2,
  int8: 1,
  int4: 0.5,  
}

export const GPU_VRAM = {
  'RTX 3080':  10,
  'RTX 3090':  24,
  'RTX 4080':  16,
  'RTX 4090':  24,
  'A10G':      24,
  'V100':      32,
  'A100':      80,
  'H100':      80,
  'H200':     141,  
}

export const PRECISION_LABELS = {
  fp32: 'fp32 — 4 bytes',
  fp16: 'fp16 — 2 bytes',
  bf16: 'bf16 — 2 bytes',
  int8: 'int8 — 1 byte',
  int4: 'int4 — 0.5 bytes',  
}