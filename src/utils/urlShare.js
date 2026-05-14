import LZString from 'lz-string'

export function serializeToURL(layers, config) {
  const payload = JSON.stringify({ layers, config })
  const compressed = LZString.compressToEncodedURIComponent(payload)
  window.location.hash = compressed
  return compressed
}

export function deserializeFromURL() {
  const hash = window.location.hash.slice(1)
  if (!hash) return null

  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(hash)
    if (!decompressed) return null
    return JSON.parse(decompressed)
  } catch {
    return null
  }
}
export async function copyShareURL(layers, config) {
  serializeToURL(layers, config)
  const url = window.location.href
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}