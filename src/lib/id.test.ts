import { describe, expect, it } from 'vitest'
import { newId } from './id.ts'

describe('newId', () => {
  it('uses randomUUID when the browser offers it', () => {
    expect(newId({ randomUUID: () => 'abc' })).toBe('abc')
  })
  it('falls back to its own unique ids when it does not', () => {
    const ids = new Set(Array.from({ length: 500 }, () => newId({})))
    expect(ids.size).toBe(500)
    expect([...ids].every((id) => typeof id === 'string' && id.length >= 12)).toBe(true)
  })
})
