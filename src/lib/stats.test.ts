import { describe, expect, it } from 'vitest'
import { intensityLevel, monthData, pruneOrphans, subjectTotals, weekData } from './stats.ts'
import type { Session, Subject } from './types.ts'

const subjects: Subject[] = [
  { id: 'a', name: 'Math', color: '#f00' },
  { id: 'b', name: 'Bio', color: '#0f0' },
]
const sessions: Session[] = [
  { id: '1', subjectId: 'a', seconds: 600, date: '2026-11-10' },
  { id: '2', subjectId: 'b', seconds: 300, date: '2026-11-10' },
  { id: '3', subjectId: 'a', seconds: 1200, date: '2026-11-04' },
  { id: '4', subjectId: 'a', seconds: 900, date: '2026-11-03' },
  { id: '5', subjectId: 'b', seconds: 100, date: '2026-10-31' },
]

describe('pruneOrphans', () => {
  it('drops sessions whose subject no longer exists', () => {
    const out = pruneOrphans(
      [...sessions, { id: 'x', subjectId: 'gone', seconds: 5, date: '2026-11-10' }],
      subjects,
    )
    expect(out.map((s) => s.id)).toEqual(['1', '2', '3', '4', '5'])
  })
})

describe('weekData', () => {
  it('returns seven days ending today with per-subject parts', () => {
    const w = weekData(sessions, subjects, '2026-11-10')
    expect(w).toHaveLength(7)
    expect(w[0].date).toBe('2026-11-04')
    expect(w[6].date).toBe('2026-11-10')
    expect(w[6].total).toBe(900)
    expect(w[6].parts).toEqual([
      { subjectId: 'a', seconds: 600 },
      { subjectId: 'b', seconds: 300 },
    ])
    expect(w[0].total).toBe(1200)
    expect(w[1]).toEqual({ date: '2026-11-05', total: 0, parts: [] })
  })
  it('works with no data', () => {
    const w = weekData([], [], '2026-11-10')
    expect(w).toHaveLength(7)
    expect(w.every((d) => d.total === 0 && d.parts.length === 0)).toBe(true)
  })
})

describe('monthData', () => {
  it('totals each day of the month', () => {
    const m = monthData(sessions, 2026, 10)
    expect(m).toHaveLength(30)
    expect(m[9]).toEqual({ date: '2026-11-10', total: 900 })
    expect(m[2]).toEqual({ date: '2026-11-03', total: 900 })
    expect(m[0].total).toBe(0)
  })
  it('works with no data', () => {
    expect(monthData([], 2024, 1)).toHaveLength(29)
  })
})

describe('intensityLevel', () => {
  it('maps totals onto 0-4', () => {
    expect(intensityLevel(0, 100)).toBe(0)
    expect(intensityLevel(1, 100)).toBe(1)
    expect(intensityLevel(50, 100)).toBe(2)
    expect(intensityLevel(51, 100)).toBe(3)
    expect(intensityLevel(100, 100)).toBe(4)
  })
  it('handles a zero maximum', () => {
    expect(intensityLevel(0, 0)).toBe(0)
    expect(intensityLevel(10, 0)).toBe(4)
  })
})

describe('subjectTotals', () => {
  it('totals week, month and all time per subject', () => {
    expect(subjectTotals(sessions, subjects, '2026-11-10', 2026, 10)).toEqual([
      { subjectId: 'a', week: 1800, month: 2700, all: 2700 },
      { subjectId: 'b', week: 300, month: 300, all: 400 },
    ])
  })
  it('returns zeros for a subject with no sessions', () => {
    expect(subjectTotals([], subjects, '2026-11-10', 2026, 10)[0]).toEqual({
      subjectId: 'a', week: 0, month: 0, all: 0,
    })
  })
})
