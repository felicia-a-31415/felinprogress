import { useState } from 'react'
import { formatDuration, parseDateKey } from '../lib/time.ts'
import type { Session, Subject } from '../lib/types.ts'

const PAGE = 50

type Props = { sessions: Session[]; subjects: Subject[]; onDelete(id: string): void }

export function SessionList({ sessions, subjects, onDelete }: Props) {
  const [limit, setLimit] = useState(PAGE)
  const byId = new Map(subjects.map((s) => [s.id, s]))
  // newest day first; within a day, most recently logged first
  const sorted = sessions
    .map((s, index) => ({ s, index }))
    .sort((a, b) => b.s.date.localeCompare(a.s.date) || b.index - a.index)
    .map((x) => x.s)
  const shown = sorted.slice(0, limit)

  if (sorted.length === 0) return <p className="empty">No study time logged yet.</p>

  const dateText = (key: string) =>
    parseDateKey(key).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

  function remove(s: Session) {
    const name = byId.get(s.subjectId)?.name ?? 'this entry'
    if (window.confirm(`Delete ${formatDuration(s.seconds)} of ${name} on ${dateText(s.date)}?`)) {
      onDelete(s.id)
    }
  }

  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <tbody>
            {shown.map((s) => {
              const subject = byId.get(s.subjectId)
              return (
                <tr key={s.id}>
                  <td>
                    <span className="dot" style={{ background: subject?.color }} />
                    {subject?.name}
                  </td>
                  <td className="muted">{dateText(s.date)}</td>
                  <td className="num">{formatDuration(s.seconds)}</td>
                  <td className="num">
                    <button
                      className="ghost danger small"
                      aria-label={`Delete ${formatDuration(s.seconds)} of ${subject?.name ?? 'entry'} on ${dateText(s.date)}`}
                      onClick={() => remove(s)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {sorted.length > shown.length && (
        <div className="more">
          <span className="muted small">Showing {shown.length} of {sorted.length}</span>
          <button className="small" onClick={() => setLimit((n) => n + PAGE)}>Show more</button>
        </div>
      )}
    </>
  )
}
