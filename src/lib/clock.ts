import type { Clock } from './types.ts'

export function startTimer(durationMs: number, now: number): Clock {
  return { mode: 'timer', durationMs, accumulatedMs: 0, startedAt: now }
}

export function startStopwatch(now: number): Clock {
  return { mode: 'stopwatch', durationMs: 0, accumulatedMs: 0, startedAt: now }
}

export function elapsedMs(clock: Clock, now: number): number {
  const run = clock.startedAt === null ? 0 : Math.max(0, now - clock.startedAt)
  const total = clock.accumulatedMs + run
  return clock.mode === 'timer' ? Math.min(total, clock.durationMs) : total
}

export function remainingMs(clock: Clock, now: number): number {
  return Math.max(0, clock.durationMs - elapsedMs(clock, now))
}

export function isFinished(clock: Clock, now: number): boolean {
  return clock.mode === 'timer' && elapsedMs(clock, now) >= clock.durationMs
}

export function pause(clock: Clock, now: number): Clock {
  if (clock.startedAt === null) return clock
  return { ...clock, accumulatedMs: elapsedMs(clock, now), startedAt: null }
}

export function resume(clock: Clock, now: number): Clock {
  if (clock.startedAt !== null) return clock
  return { ...clock, startedAt: now }
}
