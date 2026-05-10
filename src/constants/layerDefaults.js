export const LAYER_TYPES = ['Conv2D', 'MaxPool2D', 'Dense', 'Flatten', 'BatchNorm', 'Dropout', 'Merge', 'Reshape', 'Permute', 'MultiHeadAttention', 'LSTM', 'Embedding', 'LayerNorm']

export const LAYER_DEFAULTS = {
  Conv2D: {
    filters: 64,
    kernelSize: 3,
    stride: 1,
    padding: 1,
    dilation: 1,
  },
  MaxPool2D: {
    kernelSize: 2,
    stride: 2,
    padding: 0,
  },
  Dense: {
    units: 256,
  },
  Flatten: {},
  BatchNorm: {
    eps: 1e-5,
    momentum: 0.1,
  },
  Dropout: {
    p: 0.5,
  },
  Merge: {
    mode: 'add',
  },

  Reshape: {
    targetC: 64,
    targetH: 8,
    targetW: 8,
  },
  // Permute: default is identity for a 4-D tensor
  Permute: {
    permutation: [0, 1, 2, 3],
  },
  MultiHeadAttention: {
    embed_dim: 512,
    num_heads: 8,
    dropout: 0.1,
  },
  LSTM: {
    hidden_size: 256,
    num_layers: 1,
    bidirectional: false,
    return_sequences: true,
  },
  Embedding: {
    num_embeddings: 10000,
    embedding_dim: 256,
  },
  LayerNorm: {},
}

export const LAYER_PARAM_RANGES = {
  Conv2D: {
    filters:    { min: 1,    max: 2048, step: 1    },
    kernelSize: { min: 1,    max: 11,   step: 2    },
    stride:     { min: 1,    max: 4,    step: 1    },
    padding:    { min: 0,    max: 8,    step: 1    },
    dilation:   { min: 1,    max: 4,    step: 1    },
  },
  MaxPool2D: {
    kernelSize: { min: 2, max: 8, step: 1 },
    stride:     { min: 1, max: 4, step: 1 },
    padding:    { min: 0, max: 4, step: 1 },
  },
  Dense: {
    units: { min: 1, max: 4096, step: 1 },
  },
  BatchNorm: {
    eps:      { min: 1e-6, max: 1e-3, step: 1e-6 },
    momentum: { min: 0.01, max: 0.99, step: 0.01  },
  },
  Dropout: {
    p: { min: 0.0, max: 0.99, step: 0.01 },
  },
  Merge:   {},   // no need for as it will be toggled via button 
  // Reshape / Permute have custom Inspector UIs — so thatswhy no generic sliders
  Reshape: {},
  Permute: {},
  MultiHeadAttention: {
    embed_dim: { min: 64,  max: 2048, step: 64  },
    num_heads:  { min: 1,   max: 64,   step: 1   },
    dropout:    { min: 0.0, max: 0.9,  step: 0.01 },
  },
  LSTM: {
    hidden_size: { min: 16, max: 2048, step: 16 },
    num_layers:  { min: 1,  max: 8,    step: 1  },
  },
  Embedding: {
    num_embeddings: { min: 100,  max: 100000, step: 100 },
    embedding_dim:  { min: 16,   max: 2048,   step: 16  },
  },
  LayerNorm: {},
}

export const LAYER_COLORS = {
  Conv2D:    '#00E5FF',
  MaxPool2D: '#7C3AED',
  Dense:     '#10B981',
  Flatten:   '#F59E0B',
  BatchNorm: '#EC4899',
  Dropout:   '#64748B',
  Input:     '#39FF14',
  Merge:     '#F59E0B',
  Reshape:   '#818CF8',   // indigo — shape-manipulation family
  Permute:   '#34D399',   // emerald — distinct from Dense green
  MultiHeadAttention: '#A855F7', // electric purple — attention
  LSTM:      '#F472B6',   // pink — recurrent family
  Embedding: '#FB923C',   // orange — input processing
  LayerNorm: '#94A3B8',   // slate — normalization (distinct from BatchNorm pink)

  MultiHeadAttention: '#A855F7',
  LSTM:      '#F472B6',
  Embedding: '#FB923C',
  LayerNorm: '#94A3B8',
}

export const LAYER_TYPE_BADGE = {
  Conv2D:             'CONV',
  MaxPool2D:          'POOL',
  Dense:              'FC',
  Flatten:            'FLAT',
  BatchNorm:          'NORM',
  Dropout:            'REG',
  Input:              'IN',
  Merge:              'MERGE',
  Reshape:            'RSHP',
  Permute:            'PERM',
  MultiHeadAttention: 'ATTN',
  LSTM:               'LSTM',
  Embedding:          'EMBD',
  LayerNorm:          'LN',
}

export const LAYER_TOOLTIPS = {
  Conv2D:             'filters=64, k=3, s=1, pad=1',
  MaxPool2D:          'k=2, s=2, pad=0',
  Dense:              'units=256',
  Flatten:            'No parameters',
  BatchNorm:          'eps=1e-5, momentum=0.1',
  Dropout:            'p=0.5',
  Merge:              'ADD: identical shapes | CONCAT: sum channels',
  Reshape:            'Target shape [C, H, W]. Batch is preserved.',
  Permute:            'Reorder dims, e.g. [0,2,3,1] → NHWC',
  MultiHeadAttention: 'embed_dim=512, num_heads=8. embed_dim % num_heads must == 0',
  LSTM:               'hidden=256, layers=1. Toggle bidirectional & return_sequences',
  Embedding:          'vocab=10000, dim=256. Input: [B, seq_len] token IDs',
  LayerNorm:          'Shape passthrough. Normalizes last dim(s) per token',
}