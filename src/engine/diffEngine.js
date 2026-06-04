// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Gyan Shresth
// See LICENSE file in the project root for full license text.

function buildTopoOrder(nodes, edges) {
 const order = new Map()
 const adj = new Map()
 const indegree = new Map()

 for (const n of nodes) {
   adj.set(n.id, [])
   indegree.set(n.id, 0)
 }
 for (const e of edges) {
   if (adj.has(e.source) && adj.has(e.target)) {
     adj.get(e.source).push(e.target)
     indegree.set(e.target, (indegree.get(e.target) || 0) + 1)
   }
 }

 const queue = []
 for (const [id, deg] of indegree) {
   if (deg === 0) queue.push(id)
 }

 let idx = 0
 while (queue.length) {
   const curr = queue.shift()
   order.set(curr, idx++)
   for (const next of (adj.get(curr) || [])) {
     const newDeg = indegree.get(next) - 1
     indegree.set(next, newDeg)
     if (newDeg === 0) queue.push(next)
   }
 }

 // Assign remaining (cycles / disconnected) in arbitrary order
 for (const n of nodes) {
   if (!order.has(n.id)) order.set(n.id, idx++)
 }

 return order
}


function getLayerType(node) {
 return node?.data?.layerType ?? node?.type ?? 'unknown'
}

export function matchNodes(nodesA, nodesB, edgesA = [], edgesB = []) {
 const matchedAtoB = new Map()
 const usedB = new Set()

 const byIdB = new Map(nodesB.map(n => [n.id, n]))

 
 for (const nA of nodesA) {
   if (byIdB.has(nA.id)) {
     matchedAtoB.set(nA.id, nA.id)
     usedB.add(nA.id)
   }
 }

 
 const unmatchedA = nodesA.filter(n => !matchedAtoB.has(n.id))
 const unmatchedB = nodesB.filter(n => !usedB.has(n.id))

 if (unmatchedA.length && unmatchedB.length) {
   const topoA = buildTopoOrder(nodesA, edgesA)
   const topoB = buildTopoOrder(nodesB, edgesB)

  
   const sigB = new Map()
   for (const nB of unmatchedB) {
     const key = `${topoB.get(nB.id)}_${getLayerType(nB)}`
     if (!sigB.has(key)) sigB.set(key, nB.id)
   }

   for (const nA of unmatchedA) {
     const key = `${topoA.get(nA.id)}_${getLayerType(nA)}`
     if (sigB.has(key)) {
       const idB = sigB.get(key)
       matchedAtoB.set(nA.id, idB)
       usedB.add(idB)
       sigB.delete(key) // one-to-one
     }
   }
 }

 const unmatchedAIds = nodesA.filter(n => !matchedAtoB.has(n.id)).map(n => n.id)
 const unmatchedBIds = nodesB.filter(n => !usedB.has(n.id)).map(n => n.id)

 return { matched: matchedAtoB, unmatchedA: unmatchedAIds, unmatchedB: unmatchedBIds }
}

export function classifyChanges(nodeA, nodeB) {
 const configA = nodeA?.data?.config ?? {}
 const configB = nodeB?.data?.config ?? {}

 const allKeys = new Set([...Object.keys(configA), ...Object.keys(configB)])
 const changes = []

 for (const key of allKeys) {
   const valA = configA[key]
   const valB = configB[key]
   
   if (JSON.stringify(valA) !== JSON.stringify(valB)) {
     changes.push({ param: key, from: valA, to: valB })
   }
 }

 
 const typeA = getLayerType(nodeA)
 const typeB = getLayerType(nodeB)
 if (typeA !== typeB) {
   changes.push({ param: '__layerType', from: typeA, to: typeB })
 }

 return changes
}



/**
* @param {Snapshot} snapshotA  — "base" (older) snapshot
* @param {Snapshot} snapshotB  — "target" (newer) snapshot
* @returns {DiffResult}
*/
export function diffGraphs(snapshotA, snapshotB) {
 const nodesA = snapshotA.nodes ?? []
 const nodesB = snapshotB.nodes ?? []
 const edgesA = snapshotA.edges ?? []
 const edgesB = snapshotB.edges ?? []


 const { matched, unmatchedA, unmatchedB } = matchNodes(nodesA, nodesB, edgesA, edgesB)

 const byIdA = new Map(nodesA.map(n => [n.id, n]))
 const byIdB = new Map(nodesB.map(n => [n.id, n]))

 const unchanged = []
 const modified = []

 for (const [idA, idB] of matched) {
   const nA = byIdA.get(idA)
   const nB = byIdB.get(idB)
   const changes = classifyChanges(nA, nB)
   if (changes.length === 0) {
     unchanged.push(idB)         
   } else {
     modified.push({ nodeId: idB, sourceNodeId: idA, changes })
   }
 }

 const added   = unmatchedB  
 const deleted = unmatchedA 

 
 const edgeKeyA = new Set(edgesA.map(e => `${e.source}→${e.target}`))
 const edgeKeyB = new Set(edgesB.map(e => `${e.source}→${e.target}`))

 
 const idTranslate = new Map()
 for (const [idA, idB] of matched) idTranslate.set(idA, idB)

 const edgeKeyATranslated = new Set(
   edgesA.map(e => {
     const src = idTranslate.get(e.source) ?? e.source
     const tgt = idTranslate.get(e.target) ?? e.target
     return `${src}→${tgt}`
   })
 )

 const edgesAdded   = edgesB
   .filter(e => !edgeKeyATranslated.has(`${e.source}→${e.target}`))
   .map(e => e.id)

 const edgesDeleted = edgesA
   .filter(e => {
     const src = idTranslate.get(e.source) ?? e.source
     const tgt = idTranslate.get(e.target) ?? e.target
     return !edgeKeyB.has(`${src}→${tgt}`)
   })
   .map(e => e.id)

 return {
   unchanged,
   modified,
   added,
   deleted,
   edgesAdded,
   edgesDeleted,
   _meta: {
     snapshotAId:   snapshotA.id,
     snapshotBId:   snapshotB.id,
     snapshotAName: snapshotA.name,
     snapshotBName: snapshotB.name,
   },
 }
}

export function buildNodeStateMap(diffResult, deletedNodes = []) {
 if (!diffResult) return new Map()

 const map = new Map()

 for (const id of diffResult.unchanged) {
   map.set(id, { state: 'unchanged', changes: [] })
 }
 for (const { nodeId, changes } of diffResult.modified) {
   map.set(nodeId, { state: 'modified', changes })
 }
 for (const id of diffResult.added) {
   map.set(id, { state: 'added', changes: [] })
 }
 
 for (const id of diffResult.deleted) {
   map.set(id, { state: 'deleted', changes: [] })
 }

 return map
}


export function buildEdgeStateMap(diffResult) {
 if (!diffResult) return new Map()
 const map = new Map()
 for (const id of diffResult.edgesAdded)   map.set(id, 'added')
 for (const id of diffResult.edgesDeleted) map.set(id, 'deleted')
 return map
}