import { intensityLevel } from '../lib/stats.ts'
import type { DayTotal } from '../lib/stats.ts'
import { formatCompact, formatDuration, parseDateKey } from '../lib/time.ts'

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type Props = { days: DayTotal[]; todayKey: string }

/**
 * Weeks start on Monday. Squares get stronger with more study; the theme
 * decides whether stronger means lighter (dark mode) or darker (light mode).
 */
export function MonthGrid({ days, todayKey }: Props) {
  const max = Math.max(0, ...days.map((d) => d.total))
  const blanks = days.length > 0 ? (parseDateKey(days[0].date).getDay() + 6) % 7 : 0
  return (
    <div className="month">
      {DOW.map((d) => (
        <div className="dow" key={d}>{d}</div>
      ))}
      {Array.from({ length: blanks }, (_, i) => (
        <div key={`blank-${i}`} />
      ))}
      {days.map((day) => {
        const level = intensityLevel(day.total, max)
        return (
          <div
            key={day.date}
            className={`cell lvl-${level}${day.date === todayKey ? ' today' : ''}`}
            title={day.total > 0 ? formatDuration(day.total) : undefined}
            aria-label={`${day.date}: ${day.total > 0 ? formatDuration(day.total) : 'no study time'}`}
          >
            <span className="day">{Number(day.date.slice(8))}</span>
            <span className="amount">{day.total > 0 ? formatCompact(day.total) : ''}</span>
          </div>
        )
      })}
    </div>
  )
}
