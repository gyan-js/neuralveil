# 🧠 Tensor Shape Debugger

![Status](https://img.shields.io/badge/status-V1%20stable%20·%20V2%20stable-8b5cf6?style=flat-square)
![Stack](https://img.shields.io/badge/stack-React%2019%20·%20Zustand%20·%20React%20Flow-14b8a6?style=flat-square)
![Framework](https://img.shields.io/badge/supports-PyTorch%20·%20TensorFlow-f97316?style=flat-square)

> A visual, drag-and-drop neural network canvas that propagates tensor shapes
> in real time — so you catch shape errors before you write a single line of
> training code.

**Built by Gyan · Class 12th**  
React 19 · Zustand · React Flow · Tailwind CSS

## The Problem
 
Shape errors are the #1 frustration in deep learning. You stack a few layers, hit run, and get:
 
```
RuntimeError: Expected input channels 64, got 128
```
 
No context. No visual. Just a crash after a 10-minute wait.
 
Tensor Shape Debugger solves this at the design stage — before training ever starts.
 
---
 
## How It Works
 
Drop layers onto a canvas. Connect them. Every edge instantly shows the tensor shape flowing through it — like `[batch, 64, 112, 112]`. If something breaks (kernel too large, channel mismatch, wrong flatten), you see a plain-English error right there on the node. No runtime. No guessing.
 
---
 
## 🌱 Initial Build (V1.0.1)
 
### Core
- **Drag-and-drop layer palette** — Conv2D, MaxPool, Dense, Flatten, BatchNorm, Dropout
- **Live shape badges on every edge** — e.g. `[batch, 64, 112, 112]` updates as you tweak params
- **Shape error detection** with human-readable messages — *"Kernel 5×5 too large for 3×3 feature map"*
- **Configurable layer params** — kernel size, stride, padding, filters, units
- **Input shape configurator** — image (`H × W × C`) or sequence (`L × D`)
### What Sets It Apart
- **NCHW ↔ NHWC toggle** — switch between PyTorch and TensorFlow dimension conventions
- **Per-layer parameter count** + cumulative total displayed live
- **One-click PyTorch export** — generates a ready-to-use model skeleton from your canvas
- **Save / load architecture as JSON**
---
 
## 🔭 Current Build (V2.0.3)
 
V1 handles standard CNNs cleanly. V2 makes real-world architectures — ResNets, Transformers, LSTMs — fully expressible.
 
### Phase 1 — Architecture Expressibility
These are the gatekeepers. Without them, no serious architecture is fully buildable.
 
- **Skip / Residual connections** — a Merge node that accepts multiple inputs and handles ADD (residual) or CONCAT (dense block). Unlocks ResNet, UNet, DenseNet.
- **Reshape / Permute layer** — one of the most common shape bug sources in real code. Validates element count on reshape, reorders dims on permute.
- **Dynamic batch size (`None` / `-1`)** — matches PyTorch's actual default. Null dims propagate correctly through the entire graph.
### Phase 2 — New Layer Types
Each follows the same pattern already established in V1 — only the shape math differs.
 
- **MultiHeadAttention** — `(B, seq, embed)` → `(B, seq, embed)`. Validates `embed_dim % num_heads == 0`, shows `head_dim` as a live computed field. Unlocks Transformers, ViT, BERT.
- **LSTM / GRU** — handles `return_sequences` and `bidirectional` flags. Unlocks sequence models and text classifiers.
- **Embedding** — `(B, seq_len)` → `(B, seq_len, embed_dim)`. The entry point for every NLP model.
- **LayerNorm** — shape passthrough. Required in every Transformer block.
### Phase 3 — Product Polish
- **Shareable URL** — graph serialized → LZ-compressed → base64 → URL hash. One link to share a broken architecture and ask for help.
- **Keras / TensorFlow export** — same export engine, different string templates. Doubles the audience.
- **Architecture presets** — one-click load for ResNet block, Transformer encoder, VGG block, LSTM classifier.
---
 
## 🛠 Tech Stack
 
| Layer | Technology | Why |
|---|---|---|
| UI Framework | React 19 + JavaScript | Handles complex, dynamic data structures cleanly |
| State Management | Zustand | Lightweight graph-like state without Redux boilerplate |
| Graph / Canvas | React Flow | Purpose-built for node-based drag-and-drop UIs |
| Math Engine | Custom JS | Shape propagation is pure math — no library needed |
| Styling | Tailwind CSS | Fast, consistent, no context switching |
| Error Display | Custom error boundary + inline | Real-time feedback per layer, not a generic modal |
| Testing | Vitest + Testing Library | Unit-tests shape logic independently from the UI |
 
---
