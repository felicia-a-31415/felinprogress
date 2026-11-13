type CryptoLike = { randomUUID?: () => string }

/**
 * A unique id. `crypto.randomUUID` only exists on https and localhost, so
 * there is a fallback for plain-http addresses such as a phone on the
 * same wifi.
 */
export function newId(source: CryptoLike = globalThis.crypto ?? {}): string {
  if (typeof source.randomUUID === 'function') return source.randomUUID()
  const rand = () => Math.floor(Math.random() * 0xffffffff).toString(36).padStart(7, '0')
  return `${Date.now().toString(36)}-${rand()}${rand()}`
}
