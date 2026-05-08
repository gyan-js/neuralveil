import { propagateGraph, formatShape } from './shapeEngine.js'


export function exportToPyTorch(nodes, edges, inputShape) {
  const sorted = topoSortIds(nodes, edges)
  const results = propagateGraph(nodes, edges, inputShape)

  const inputNode = nodes.find(n => n.data?.layerType === 'Input')
  const nonInputNodes = sorted
    .map(id => nodes.find(n => n.id === id))
    .filter(n => n && n.data?.layerType !== 'Input')

  const layerCounters = {}
  const getLayerName = (type) => {
    const key = type.toLowerCase()
    layerCounters[key] = (layerCounters[key] || 0) + 1
    const suffix = layerCounters[key]
    const names = {
      conv2d: `conv${suffix}`,
      maxpool2d: `pool${suffix}`,
      dense: `fc${suffix}`,
      flatten: `flatten`,
      batchnorm: `bn${suffix}`,
      dropout: `dropout${suffix === 1 ? '' : suffix}`,
    }
    return names[key] || `layer${suffix}`
  }

  const layerNameMap = {}
  const initLines = []
  const forwardLines = []

  for (const node of nonInputNodes) {
    const type = node.data?.layerType
    const cfg = node.data?.config || {}
    const name = getLayerName(type)
    layerNameMap[node.id] = name

    const inEdge = edges.find(e => e.target === node.id)
    const sourceId = inEdge?.source
    const inResult = sourceId ? results[sourceId] : null
    const inShape = inResult?.outputShape || null

    let initLine = ''
    let forwardLine = ''

    switch (type) {
      case 'Conv2D': {
        const inC = inShape?.[1] ?? '???'
        const { filters = 64, kernelSize = 3, stride = 1, padding = 0 } = cfg
        initLine = `        self.${name} = nn.Conv2d(in_channels=${inC}, out_channels=${filters}, kernel_size=${kernelSize}, stride=${stride}, padding=${padding})`
        forwardLine = `        x = torch.relu(self.${name}(x))`
        break
      }
      case 'MaxPool2D': {
        const { kernelSize = 2, stride = 2 } = cfg
        initLine = `        self.${name} = nn.MaxPool2d(kernel_size=${kernelSize}, stride=${stride})`
        forwardLine = `        x = self.${name}(x)`
        break
      }
      case 'Dense': {
        const inF = inShape?.[1] ?? '???'
        const { units = 256 } = cfg
        const isLast = nonInputNodes.indexOf(node) === nonInputNodes.length - 1
        initLine = `        self.${name} = nn.Linear(in_features=${inF}, out_features=${units})`
        forwardLine = isLast
          ? `        x = self.${name}(x)`
          : `        x = torch.relu(self.${name}(x))`
        break
      }
      case 'Flatten': {
        initLine = `        self.${name} = nn.Flatten()`
        forwardLine = `        x = self.${name}(x)`
        break
      }
      case 'BatchNorm': {
        const channels = inShape?.[1] ?? '???'
        initLine = `        self.${name} = nn.BatchNorm2d(num_features=${channels})`
        forwardLine = `        x = self.${name}(x)`
        break
      }
      case 'Dropout': {
        const { p = 0.5 } = cfg
        initLine = `        self.${name} = nn.Dropout(p=${p})`
        forwardLine = `        x = self.${name}(x)`
        break
      }
    }

    if (initLine) initLines.push(initLine)
    if (forwardLine) forwardLines.push(forwardLine)
  }

  const [b, c, h, w] = inputShape
  const batchCode = b === 1 ? '1' : b

  const code = `import torch
import torch.nn as nn


class GeneratedModel(nn.Module):
    def __init__(self):
        super().__init__()
${initLines.join('\n')}

    def forward(self, x):
${forwardLines.join('\n')}
        return x


if __name__ == '__main__':
    model = GeneratedModel()
    print(model)
    x = torch.randn(${batchCode}, ${c}, ${h}, ${w})
    out = model(x)
    print(f"Output shape: {out.shape}")
`
  return code
}


export function exportToJSON(nodes, edges, inputShape, format) {
  const exportNodes = nodes.map(n => ({
    id: n.id,
    type: n.data?.layerType,
    position: n.position,
    config: n.data?.config || {},
  }))

  return JSON.stringify({
    version: '1.0',
    format,
    inputShape,
    nodes: exportNodes,
    edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
  }, null, 2)
}


function topoSortIds(nodes, edges) {
  const adj = {}
  const inDegree = {}

  for (const n of nodes) {
    adj[n.id] = []
    inDegree[n.id] = 0
  }

  for (const e of edges) {
    if (adj[e.source]) adj[e.source].push(e.target)
    if (inDegree[e.target] !== undefined) inDegree[e.target]++
  }

  const queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id)
  const sorted = []

  while (queue.length > 0) {
    const curr = queue.shift()
    sorted.push(curr)
    for (const nb of (adj[curr] || [])) {
      inDegree[nb]--
      if (inDegree[nb] === 0) queue.push(nb)
    }
  }

  return sorted
}
