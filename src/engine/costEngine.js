import cloudPricing from '../data/cloudPricing.json'



const GPU_TFLOPS = {

  H100:   989,
  A100:   312,
  A10:    125,
  A10G:   125,
  A40:    149,
  RTX4090:165,
  RTX3090: 71,
  RTX6000: 91,
  V100:    14,   
  T4:      65,
}

function getTFLOPS(gpuName) {
  const upper = gpuName.toUpperCase().replace(/\s/g, '')
  for (const [key, val] of Object.entries(GPU_TFLOPS)) {
    if (upper.includes(key.toUpperCase())) return val
  }
  return 50 
}

export function estimateTrainingHours({ datasetTokens = 1e9, batchSize = 8, seqLen = 512, numEpochs = 1, numGPUs = 1, totalParams = 1e8, gpuName = 'A100' }) {
  const stepsPerEpoch = Math.ceil(datasetTokens / (batchSize * seqLen))
  const tflops = getTFLOPS(gpuName)
 
  const tokensPerSecPerGPU = (tflops * 1e12 * 0.5) / (6 * Math.max(totalParams, 1))
  const tokensPerSec = tokensPerSecPerGPU * numGPUs
  const tokensPerEpoch = datasetTokens
  const secondsPerEpoch = tokensPerEpoch / Math.max(tokensPerSec, 1)
  const hoursPerEpoch = secondsPerEpoch / 3600
  const totalHours = hoursPerEpoch * numEpochs
  return { stepsPerEpoch, tokensPerSec: Math.round(tokensPerSec), hoursPerEpoch, totalHours }
}


export function estimateCost(totalGB, trainingHours, numGPUs = 1) {
  const rows = []
  for (const [provider, gpus] of Object.entries(cloudPricing)) {
    for (const gpu of gpus) {
      const fits = gpu.vramGB >= totalGB
      const totalCostUSD = gpu.hourlyUSD * numGPUs * trainingHours
      rows.push({
        provider,
        gpuName: gpu.gpuName,
        vramGB: gpu.vramGB,
        hourlyUSD: gpu.hourlyUSD,
        totalCostUSD: parseFloat(totalCostUSD.toFixed(2)),
        fits,
      })
    }
  }
  const sorted = rows
    .filter(r => r.fits)
    .sort((a, b) => a.totalCostUSD - b.totalCostUSD)
  const all = rows.sort((a, b) => a.totalCostUSD - b.totalCostUSD)

  if (sorted.length > 0) sorted[0].cheapest = true
  return { fittingGPUs: sorted, allGPUs: all }
}