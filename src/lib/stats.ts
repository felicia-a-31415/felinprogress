import { lastNDays, monthKeys, pad2 } from './time.ts'
import type { Session, Subject } from './types.ts'

export function pruneOrphans(sessions: Session[], subjects: Subject[]): Session[] {
  const ids = new Set(subjects.map((s) => s.id))
  return sessions.filter((s) => ids.has(s.subjectId))
}

export type DayBreakdown = {
  date: string
  total: number
  parts: { subjectId: string; seconds: number }[]
}

/** the 7 days ending today, oldest first; parts follow subject order */
export function weekData(
  sessions: Session[],
  subjects: Subject[],
  todayKey: string,
): DayBreakdown[] {
  return lastNDays(todayKey, 7).map((date) => {
    const parts: DayBreakdown['parts'] = []
    for (const subject of subjects) {
      let seconds = 0
      for (const s of sessions) {
        if (s.date === date && s.subjectId === subject.id) seconds += s.seconds
      }
      if (seconds > 0) parts.push({ subjectId: subject.id, seconds })
    }
    const total = parts.reduce((sum, p) => sum + p.seconds, 0)
    return { date, total, parts }
  })
}

export type DayTotal = { date: string; total: number }

export function monthData(sessions: Session[], year: number, month0: number): DayTotal[] {
  const totals = new Map<string, number>()
  for (const s of sessions) totals.set(s.date, (totals.get(s.date) ?? 0) + s.seconds)
  return monthKeys(year, month0).map((date) => ({ date, total: totals.get(date) ?? 0 }))
}

/** 0 = nothing, 4 = the busiest day */
export function intensityLevel(total: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (total <= 0) return 0
  if (max <= 0) return 4
  const level = Math.min(4, Math.max(1, Math.ceil((total / max) * 4)))
  return level as 1 | 2 | 3 | 4
}

export type SubjectTotal = { subjectId: string; week: number; month: number; all: number }

export function subjectTotals(
  sessions: Session[],
  subjects: Subject[],
  todayKey: string,
  year: number,
  month0: number,
): SubjectTotal[] {
  const weekDays = new Set(lastNDays(todayKey, 7))
  const monthPrefix = `${year}-${pad2(month0 + 1)}-`
  return subjects.map((subject) => {
    const t: SubjectTotal = { subjectId: subject.id, week: 0, month: 0, all: 0 }
    for (const s of sessions) {
      if (s.subjectId !== subject.id) continue
      t.all += s.seconds
      if (weekDays.has(s.date)) t.week += s.seconds
      if (s.date.startsWith(monthPrefix)) t.month += s.seconds
    }
    return t
  })
}
