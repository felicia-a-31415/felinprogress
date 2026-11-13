import { useState } from 'react'
import { nextColor } from '../lib/palette.ts'
import type { SubjectTotal } from '../lib/stats.ts'
import { formatDuration } from '../lib/time.ts'
import type { Subject } from '../lib/types.ts'

/** a name box that saves when you leave it, and refuses to save an empty name */
function NameInput({ name, onCommit }: { name: string; onCommit(name: string): void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    const trimmed = (draft ?? name).trim()
    if (trimmed !== '' && trimmed !== name) onCommit(trimmed)
    setDraft(null)
  }
  return (
    <input
      type="text" value={draft ?? name} maxLength={40} aria-label="Subject name"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') setDraft(null)
      }}
    />
  )
}

type Props = {
  subjects: Subject[]
  totals: SubjectTotal[]
  onAdd(name: string, color: string): void
  onUpdate(id: string, patch: Partial<Pick<Subject, 'name' | 'color' | 'archived'>>): void
  onDelete(id: string): void
}

export function SubjectTable({ subjects, totals, onAdd, onUpdate, onDelete }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(() => nextColor(subjects.length))
  const totalFor = new Map(totals.map((t) => [t.subjectId, t]))

  function add() {
    const trimmed = name.trim()
    if (trimmed === '') return
    onAdd(trimmed, color)
    setName('')
    setColor(nextColor(subjects.length + 1))
  }

  function remove(subject: Subject) {
    const ok = window.confirm(
      `Delete "${subject.name}" and all the study time logged to it? This cannot be undone.`,
    )
    if (ok) onDelete(subject.id)
  }

  const active = subjects.filter((s) => !s.archived)
  const archived = subjects.filter((s) => s.archived)

  const table = (rows: Subject[], isArchived: boolean) => (
    <div className="table-wrap">
      <table className="table subjects-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th className="num">7 days</th>
            <th className="num">Month</th>
            <th className="num">All time</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const t = totalFor.get(s.id)
            return (
              <tr key={s.id}>
                <td>
                  <div className="subject-cell">
                    <input
                      type="color" value={s.color} aria-label={`Colour for ${s.name}`}
                      onChange={(e) => onUpdate(s.id, { color: e.target.value })}
                    />
                    <NameInput name={s.name} onCommit={(n) => onUpdate(s.id, { name: n })} />
                  </div>
                </td>
                <td className="num">{formatDuration(t?.week ?? 0)}</td>
                <td className="num">{formatDuration(t?.month ?? 0)}</td>
                <td className="num">{formatDuration(t?.all ?? 0)}</td>
                <td className="num">
                  <button
                    className="ghost small"
                    aria-label={`${isArchived ? 'Restore' : 'Archive'} ${s.name}`}
                    onClick={() => onUpdate(s.id, { archived: !isArchived })}
                  >
                    {isArchived ? 'Restore' : 'Archive'}
                  </button>
                  <button className="ghost danger small" aria-label={`Delete ${s.name}`} onClick={() => remove(s)}>
                    Delete
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <>
      {active.length === 0 ? (
        <p className="empty">
          {archived.length === 0 ? 'No subjects yet. Add your first one below.' : 'All your subjects are archived.'}
        </p>
      ) : (
        table(active, false)
      )}
      <div className="add-row">
        <input
          type="color" aria-label="New subject colour"
          value={color} onChange={(e) => setColor(e.target.value)}
        />
        <input
          type="text" placeholder="New subject" aria-label="New subject name"
          value={name} maxLength={40}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add() }}
        />
        <button onClick={add} disabled={name.trim() === ''}>Add subject</button>
      </div>
      {archived.length > 0 && (
        <details className="archived">
          <summary>Archived ({archived.length})</summary>
          <p className="muted small">
            Archived subjects keep their logged time in your stats but are not offered when you log new time.
          </p>
          {table(archived, true)}
        </details>
      )}
    </>
  )
}
