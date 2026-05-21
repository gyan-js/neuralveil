
export function analyzeConstraints(results, config) {
    const { totals, recommended, gpuFit } = results
    const { mode, precision, optimizerType, batchSize } = config
  
    const totalGB = totals?.total ?? 0
    const smallestFitting = gpuFit?.find(g => g.fits)
    const gpuVRAM = smallestFitting?.vramGB ?? Infinity
    const memoryTight = totalGB > gpuVRAM * 0.85
  /* BELOW ARE  THE CONSTRAINTS SITUATIONS */
    // FSDP: doesn't fit single GPU
    const needsFSDP = mode === 'training' && !gpuFit?.some(g => g.fits && g.vramGB >= totalGB)
  
    // AMP: fp16 or bf16
    const needsAMP = precision === 'fp16' || precision === 'bf16'
  
    // 8-bit Adam: adam + memory is tight
    const needsBnbAdam = mode === 'training' && (optimizerType === 'adam' || optimizerType === 'adamw') && memoryTight
  
    // Gradient accumulation: batch size > 8 or memory tight
    const needsGradAccum = mode === 'training' && (batchSize > 8 || memoryTight)
    const recommendedAccumSteps = needsGradAccum ? Math.max(2, Math.ceil(batchSize / 4)) : 1
  
    return { needsFSDP, needsAMP, needsBnbAdam, needsGradAccum, recommendedAccumSteps, memoryTight }
  }
  

  export function generateCode(flags, config) {
    const { needsFSDP, needsAMP, needsBnbAdam, needsGradAccum, recommendedAccumSteps } = flags
    const { precision, optimizerType, batchSize, mode } = config
    const blocks = []
  

    blocks.push({
      label: 'Model Setup',
      code: `import torch
  import torch.nn as nn
  
  model = YourModel()  # replace with your architecture
  device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
  model = model.to(device)`,
    })
  

    if (needsAMP) {
      const dtype = precision === 'bf16' ? 'torch.bfloat16' : 'torch.float16'
      blocks.push({
        label: 'Mixed Precision (AMP)',
        code: `from torch.cuda.amp import autocast, GradScaler
  
  scaler = GradScaler()
  
  # In your training loop:
  with autocast(dtype=${dtype}):
      outputs = model(inputs)
      loss = criterion(outputs, targets)
  
  scaler.scale(loss).backward()
  scaler.step(optimizer)
  scaler.update()`
      })
    }
  

    if (needsBnbAdam) {
      blocks.push({
        label: '8-bit Adam (bitsandbytes)',
        code: `import bitsandbytes as bnb
  
  optimizer = bnb.optim.Adam8bit(
      model.parameters(),
      lr=1e-4,
      betas=(0.9, 0.999),
  )
  # Saves ~75% optimizer state memory vs fp32 Adam`,
      })
    } else if (mode === 'training') {
      const optName = optimizerType === 'adamw' ? 'AdamW' : 'Adam'
      blocks.push({
        label: `Optimizer (${optName})`,
        code: `optimizer = torch.optim.${optName}(
      model.parameters(),
      lr=1e-4,
      weight_decay=0.01,
  )`,
      })
    }
  

    if (needsGradAccum) {
      blocks.push({
        label: 'Gradient Accumulation',
        code: `ACCUM_STEPS = ${recommendedAccumSteps}  # effective batch size = batch_size × ACCUM_STEPS
  
  optimizer.zero_grad()
  for step, (inputs, targets) in enumerate(dataloader):
      outputs = model(inputs)
      loss = criterion(outputs, targets) / ACCUM_STEPS
      loss.backward()
  
      if (step + 1) % ACCUM_STEPS == 0:
          optimizer.step()
          optimizer.zero_grad()`,
      })
    }
  

    if (needsFSDP) {
      blocks.push({
        label: 'FSDP Wrapping (Multi-GPU)',
        code: `from torch.distributed.fsdp import FullyShardedDataParallel as FSDP
  from torch.distributed.fsdp.wrap import transformer_auto_wrap_policy
  import functools
  
  # Initialize distributed training first:
  # torchrun --nproc_per_node=NUM_GPUS train.py
  
  auto_wrap_policy = functools.partial(
      transformer_auto_wrap_policy,
      transformer_layer_cls={YourTransformerLayer},  # e.g. GPT2Block
  )
  
  model = FSDP(
      model,
      auto_wrap_policy=auto_wrap_policy,
      mixed_precision=torch.distributed.fsdp.MixedPrecision(
          param_dtype=torch.bfloat16,
          reduce_dtype=torch.bfloat16,
      ),
  )`,
      })
    }
  
    return blocks
  }