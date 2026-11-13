import { useState } from 'react'
import { isDateKey, parseDateKey, toDateKey } from '../lib/time.ts'
import { CalendarIcon, ChevronLeft, ChevronRight } from './Icons.tsx'

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

type Props = {
  value: string
  /** latest selectable day */
  max: string
  onChange(date: string): void
}

/**
 * Our own calendar instead of the browser's: a button showing the chosen
 * day that opens a month grid right below it. Weeks start on Monday and
 * days after `max` cannot be picked.
 */
export function DatePicker({ value, max, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const valid = isDateKey(value) && value <= max
  const start = parseDateKey(valid ? value : max)
  const [view, setView] = useState({ y: start.getFullYear(), m: start.getMonth() })

  const maxDate = parseDateKey(max)
  const atMax = view.y === maxDate.getFullYear() && view.m === maxDate.getMonth()
  const first = new Date(view.y, view.m, 1)
  const blanks = (first.getDay() + 6) % 7
  const count = new Date(view.y, view.m + 1, 0).getDate()

  function shift(by: number) {
    const d = new Date(view.y, view.m + by, 1)
    setView({ y: d.getFullYear(), m: d.getMonth() })
  }

  function type(text: string) {
    onChange(text)
    if (isDateKey(text) && text <= max) {
      const d = parseDateKey(text)
      setView({ y: d.getFullYear(), m: d.getMonth() })
    }
  }

  return (
    <div className="datepicker">
      <div className="date-row">
        <input
          type="text" inputMode="numeric" placeholder="YYYY-MM-DD" maxLength={10}
          aria-label="Date (YYYY-MM-DD)" aria-invalid={!valid}
          value={value} onChange={(e) => type(e.target.value)}
        />
        <button
          type="button" className="icon-btn" aria-expanded={open}
          aria-label="Open calendar" title="Open calendar"
          onClick={() => setOpen((o) => !o)}
        >
          <CalendarIcon />
        </button>
      </div>
      {open && (
        <div className="calendar" role="group" aria-label="Choose a date">
          <div className="cal-head">
            <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Previous month">
              <ChevronLeft />
            </button>
            <span>{first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
            <button type="button" className="icon-btn" onClick={() => shift(1)} disabled={atMax} aria-label="Next month">
              <ChevronRight />
            </button>
          </div>
          <div className="cal-grid">
            {DOW.map((d, i) => <span className="cal-dow" key={i}>{d}</span>)}
            {Array.from({ length: blanks }, (_, i) => <span key={`b${i}`} />)}
            {Array.from({ length: count }, (_, i) => {
              const key = toDateKey(new Date(view.y, view.m, i + 1))
              return (
                <button
                  type="button" key={key} className="cal-day"
                  aria-pressed={valid && key === value}
                  data-today={key === max || undefined}
                  disabled={key > max}
                  onClick={() => { onChange(key); setOpen(false) }}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
