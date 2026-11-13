import { useState } from 'react'
import type { DayBreakdown } from '../lib/stats.ts'
import { formatCompact, formatDuration, parseDateKey } from '../lib/time.ts'
import type { Subject } from '../lib/types.ts'

type Props = { days: DayBreakdown[]; subjects: Subject[] }

export function WeekChart({ days, subjects }: Props) {
  const max = Math.max(1, ...days.map((d) => d.total))
  const byId = new Map(subjects.map((s) => [s.id, s]))
  const [picked, setPicked] = useState<string | null>(null)
  // the picked day, or today (the last column) when none is picked or it scrolled out
  const selected = days.find((d) => d.date === picked) ?? days[days.length - 1]
  const dayName = (key: string, long = false) =>
    parseDateKey(key).toLocaleDateString(undefined, long
      ? { weekday: 'long', month: 'short', day: 'numeric' }
      : { weekday: 'short' })

  return (
    <div>
      <div className="week">
        {days.map((day) => (
          <button
            className="col" key={day.date}
            aria-pressed={day.date === selected.date}
            aria-label={`${dayName(day.date, true)}: ${day.total > 0 ? formatDuration(day.total) : 'no study time'}`}
            onClick={() => setPicked(day.date)}
          >
            <span className="total">{day.total > 0 ? formatCompact(day.total) : ''}</span>
            <span className="bar">
              {day.parts.map((p) => (
                <span
                  key={p.subjectId}
                  style={{
                    height: `${(p.seconds / max) * 100}%`,
                    background: byId.get(p.subjectId)?.color,
                  }}
                />
              ))}
            </span>
            <span className="dow">{dayName(day.date)}</span>
          </button>
        ))}
      </div>
      <p className="week-detail" aria-live="polite">
        <strong>{dayName(selected.date, true)}</strong>
        {selected.parts.length === 0 ? (
          <span className="muted">No study time</span>
        ) : (
          selected.parts.map((p) => (
            <span key={p.subjectId} className="legend">
              <span className="dot" style={{ background: byId.get(p.subjectId)?.color }} />
              {byId.get(p.subjectId)?.name} {formatDuration(p.seconds)}
            </span>
          ))
        )}
      </p>
    </div>
  )
}
