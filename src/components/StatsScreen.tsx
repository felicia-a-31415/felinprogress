import { useState } from 'react'
import { monthData, subjectTotals, weekData } from '../lib/stats.ts'
import { formatDuration, parseDateKey } from '../lib/time.ts'
import type { Store } from '../state/useStore.ts'
import { ChevronLeft, ChevronRight, PlusIcon } from './Icons.tsx'
import { MonthGrid } from './MonthGrid.tsx'
import { SessionList } from './SessionList.tsx'
import { SubjectTable } from './SubjectTable.tsx'
import { WeekChart } from './WeekChart.tsx'

type Props = { store: Store; todayKey: string; onAddManual(): void }

export function StatsScreen({ store, todayKey, onAddManual }: Props) {
  const { subjects, sessions } = store
  const today = parseDateKey(todayKey)
  // months away from the current one: 0 = this month, -1 = last month
  const [offset, setOffset] = useState(0)
  const shown = new Date(today.getFullYear(), today.getMonth() + offset, 1)
  const y = shown.getFullYear()
  const m = shown.getMonth()

  const week = weekData(sessions, subjects, todayKey)
  const month = monthData(sessions, y, m)
  const totals = subjectTotals(sessions, subjects, todayKey, y, m)
  const todayTotal = week[week.length - 1].total
  const weekTotal = week.reduce((sum, d) => sum + d.total, 0)
  const monthTotal = month.reduce((sum, d) => sum + d.total, 0)
  const monthTitle = shown.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <div className="stats">
      <div className="stats-head">
        <h1>Your study time</h1>
        <button className="primary" onClick={onAddManual}><PlusIcon /> Add time</button>
      </div>

      <div className="tiles">
        <div className="tile"><span>Today</span><strong>{formatDuration(todayTotal)}</strong></div>
        <div className="tile"><span>Past 7 days</span><strong>{formatDuration(weekTotal)}</strong></div>
        <div className="tile"><span>{monthTitle}</span><strong>{formatDuration(monthTotal)}</strong></div>
      </div>

      <section className="card">
        <h2>Past 7 days</h2>
        <WeekChart days={week} subjects={subjects} />
      </section>

      <section className="card">
        <div className="card-head">
          <h2>{monthTitle}</h2>
          <div className="pager">
            <button className="icon-btn" aria-label="Previous month" onClick={() => setOffset((n) => n - 1)}>
              <ChevronLeft />
            </button>
            <button
              className="icon-btn" aria-label="Next month" disabled={offset >= 0}
              onClick={() => setOffset((n) => n + 1)}
            >
              <ChevronRight />
            </button>
          </div>
        </div>
        <MonthGrid days={month} todayKey={todayKey} />
      </section>

      <section className="card">
        <h2>Subjects</h2>
        <SubjectTable
          subjects={subjects}
          totals={totals}
          onAdd={store.addSubject}
          onUpdate={store.updateSubject}
          onDelete={store.deleteSubject}
        />
      </section>

      <section className="card">
        <h2>Recent entries</h2>
        <SessionList sessions={sessions} subjects={subjects} onDelete={store.deleteSession} />
      </section>
    </div>
  )
}
