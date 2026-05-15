export const tensorErrors = [
  {
    lines: [
      'RuntimeError: Expected input size (32, 512) but got (32, 256)',
      '  at linear layer 3 → check your projection head',
    ],
    type: 'error',
  },
  {
    lines: [
      'ValueError: Tensors have incompatible shapes for concatenation',
      '  [128, 64, 64] vs [128, 64, 32] on dim 2',
    ],
    type: 'error',
  },
  {
    lines: [
      'silent squeeze: tensor([1, 512]) passed as [512]',
      '  — your model trained. your results are wrong.',
    ],
    type: 'warning',
  },
]

export const gpuErrors = [
  {
    lines: [
      'CUDA out of memory. Tried to allocate 2.50 GiB',
      '  (GPU 0; 10.76 GiB total capacity; 8.91 GiB already allocated)',
    ],
    type: 'error',
  },
  {
    lines: [
      'killed after 4 hours of training — batch size was too large',
      '  you found out at epoch 3. the run is gone.',
    ],
    type: 'error',
  },
  {
    lines: [
      'estimated: ~6GB. actual: 14.2GB.',
      '  optimizer states, activations, gradients — you forgot all three.',
    ],
    type: 'warning',
  },
]

export const heroTypewriterLines = [
  "RuntimeError: shape [32, 512] doesn't match [32, 256]",
  'CUDA out of memory. Tried to allocate 2.50 GiB',
  'Expected 4D tensor but got 3D',
]

export const tensorFeatures = [
  'Traces tensor dimensions at every operation',
  'Builds a visual shape-flow graph across your architecture',
  'Catches mismatches before runtime — not after',
  'Surfaces silent reshape bugs that corrupt results without crashing',
]

export const gpuFeatures = [
  'Pre-computes VRAM: weights, optimizer states, activations, gradients',
  'Runs before a single forward pass executes',
  'Accounts for mixed precision, gradient checkpointing, and batch scaling',
  'Gives you a breakdown — not just a number',
]
