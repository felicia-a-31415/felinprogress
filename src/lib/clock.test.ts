import { describe, expect, it } from 'vitest'
import {
  elapsedMs, isFinished, pause, remainingMs, resume, startStopwatch, startTimer,
} from './clock.ts'

describe('timer', () => {
  const t = startTimer(60_000, 1_000)

  it('starts running', () => {
    expect(t).toEqual({ mode: 'timer', durationMs: 60_000, accumulatedMs: 0, startedAt: 1_000 })
  })
  it('counts down from timestamps', () => {
    expect(elapsedMs(t, 31_000)).toBe(30_000)
    expect(remainingMs(t, 31_000)).toBe(30_000)
    expect(isFinished(t, 31_000)).toBe(false)
  })
  it('finishes at the end and stays finished long after', () => {
    expect(isFinished(t, 61_000)).toBe(true)
    expect(elapsedMs(t, 9_999_999)).toBe(60_000)
    expect(remainingMs(t, 9_999_999)).toBe(0)
    expect(isFinished(t, 9_999_999)).toBe(true)
  })
  it('pauses and resumes without losing or gaining time', () => {
    const p = pause(t, 31_000)
    expect(p.startedAt).toBeNull()
    expect(p.accumulatedMs).toBe(30_000)
    expect(elapsedMs(p, 99_999)).toBe(30_000)
    expect(isFinished(p, 99_999)).toBe(false)
    const r = resume(p, 50_000)
    expect(r.startedAt).toBe(50_000)
    expect(elapsedMs(r, 60_000)).toBe(40_000)
    expect(isFinished(r, 80_000)).toBe(true)
  })
  it('ignores a repeated pause or resume', () => {
    const p = pause(t, 31_000)
    expect(pause(p, 40_000)).toEqual(p)
    expect(resume(t, 40_000)).toEqual(t)
  })
  it('never goes negative if the system clock moves backwards', () => {
    expect(elapsedMs(t, 500)).toBe(0)
    expect(remainingMs(t, 500)).toBe(60_000)
  })
})

describe('stopwatch', () => {
  it('counts up and never finishes', () => {
    const s = startStopwatch(0)
    expect(s.mode).toBe('stopwatch')
    expect(elapsedMs(s, 5_000)).toBe(5_000)
    expect(isFinished(s, 99_999_999)).toBe(false)
    const p = pause(s, 5_000)
    expect(elapsedMs(resume(p, 10_000), 12_000)).toBe(7_000)
  })
})
