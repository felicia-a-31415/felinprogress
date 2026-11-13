import { describe, expect, it } from 'vitest'
import {
  addDays, formatClock, formatCompact, formatDuration, hmsToSeconds, isDateKey,
  lastNDays, monthKeys, parseDateKey, secondsToHms, toDateKey,
} from './time.ts'

describe('formatClock', () => {
  it('formats minutes and seconds', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(65)).toBe('01:05')
    expect(formatClock(59.9)).toBe('00:59')
  })
  it('adds hours when needed', () => {
    expect(formatClock(3600)).toBe('1:00:00')
    expect(formatClock(3725)).toBe('1:02:05')
  })
  it('treats negatives as zero', () => {
    expect(formatClock(-5)).toBe('00:00')
  })
})

describe('formatDuration', () => {
  it('uses the largest sensible units', () => {
    expect(formatDuration(0)).toBe('0s')
    expect(formatDuration(45)).toBe('45s')
    expect(formatDuration(60)).toBe('1m')
    expect(formatDuration(1500)).toBe('25m')
    expect(formatDuration(3600)).toBe('1h')
    expect(formatDuration(5400)).toBe('1h 30m')
  })
})

describe('formatCompact', () => {
  it('is short enough for a small square', () => {
    expect(formatCompact(45)).toBe('45s')
    expect(formatCompact(1500)).toBe('25m')
    expect(formatCompact(3600)).toBe('1:00')
    expect(formatCompact(5400)).toBe('1:30')
    expect(formatCompact(36300)).toBe('10:05')
  })
})

describe('hmsToSeconds / secondsToHms', () => {
  it('converts both ways', () => {
    expect(hmsToSeconds(1, 2, 3)).toBe(3723)
    expect(secondsToHms(3723)).toEqual({ h: 1, m: 2, s: 3 })
  })
  it('treats empty, negative and decimal input safely', () => {
    expect(hmsToSeconds(NaN, 5, 0)).toBe(300)
    expect(hmsToSeconds(-1, 0, 30)).toBe(30)
    expect(hmsToSeconds(0, 1.9, 0)).toBe(60)
  })
})

describe('day keys', () => {
  it('uses the local calendar day', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toDateKey(new Date(2026, 10, 10, 23, 59, 59))).toBe('2026-11-10')
    expect(toDateKey(parseDateKey('2026-11-10'))).toBe('2026-11-10')
  })
  it('steps across year ends, leap days and daylight-saving days', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29')
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09')
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02')
  })
  it('lists the last n days ending today', () => {
    expect(lastNDays('2026-11-10', 7)).toEqual([
      '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07',
      '2026-11-08', '2026-11-09', '2026-11-10',
    ])
  })
  it('lists every day of a month', () => {
    expect(monthKeys(2024, 1)).toHaveLength(29)
    expect(monthKeys(2026, 1)).toHaveLength(28)
    expect(monthKeys(2026, 1)[0]).toBe('2026-02-01')
    expect(monthKeys(2026, 11)[30]).toBe('2026-12-31')
  })
  it('validates day keys', () => {
    expect(isDateKey('2026-11-10')).toBe(true)
    expect(isDateKey('2026-02-30')).toBe(false)
    expect(isDateKey('2026-1-5')).toBe(false)
    expect(isDateKey(42)).toBe(false)
  })
})
