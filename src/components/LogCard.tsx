import { useEffect, useRef, useState } from 'react'
import { nextColor } from '../lib/palette.ts'
import { formatDuration, hmsToSeconds, isDateKey, secondsToHms } from '../lib/time.ts'
import type { LogDraft, Subject } from '../lib/types.ts'
import { DurationFields } from './DurationFields.tsx'
import { CloseIcon, PlusIcon } from './Icons.tsx'

const NEW = '__new__'

type Props = {
  draft: LogDraft
  /** how many more sessions are waiting behind this one */
  queued: number
  subjects: Subject[]
  /** the subject picked on the timer screen, if any */
  preferredSubjectId: string | null
  todayKey: string
  onAddSubject(name: string, color: string): Subject
  onLog(subjectId: string, seconds: number, date: string): void
  onClose(): void
}

/**
 * A small card in the corner for logging a session. It does not block the
 * rest of the page, and it only goes away through its own buttons, so a
 * finished session cannot be dismissed by accident.
 */
export function LogCard({ draft, queued, subjects, preferredSubjectId, todayKey, onAddSubject, onLog, onClose }: Props) {
  const { manual } = draft
  const [hms, setHms] = useState(() => secondsToHms(draft.seconds))
  const [editing, setEditing] = useState(manual)
  const [subjectId, setSubjectId] = useState(
    () => subjects.find((s) => s.id === preferredSubjectId)?.id ?? subjects[0]?.id ?? NEW,
  )
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(() => nextColor(subjects.length))
  const [date, setDate] = useState(todayKey)

  const card = useRef<HTMLElement>(null)
  useEffect(() => { card.current?.focus() }, [])

  const seconds = hmsToSeconds(hms.h, hms.m, hms.s)
  const subjectOk = subjectId !== NEW || newName.trim() !== ''
  const dateOk = !manual || (isDateKey(date) && date <= todayKey)
  const canLog = seconds > 0 && subjectOk && dateOk
  const chosen = subjects.find((s) => s.id === subjectId)

  function log() {
    if (!canLog) return
    const id = subjectId === NEW ? onAddSubject(newName.trim(), newColor).id : subjectId
    onLog(id, seconds, manual ? date : todayKey)
    onClose()
  }

  return (
    <section
      ref={card} tabIndex={-1} className="logcard"
      role="dialog" aria-labelledby="log-title"
    >
      <form onSubmit={(e) => { e.preventDefault(); log() }}>
        <header>
          <div>
            <p className="eyebrow">{manual ? 'Add study time' : 'Session finished'}</p>
            <h2 id="log-title">{formatDuration(seconds)}</h2>
          </div>
          <button
            type="button" className="icon-btn" onClick={onClose}
            aria-label={manual ? 'Cancel' : 'Discard this session'}
            title={manual ? 'Cancel' : 'Discard'}
          >
            <CloseIcon />
          </button>
        </header>

        {editing ? (
          <DurationFields value={hms} onChange={setHms} />
        ) : (
          <button type="button" className="link" onClick={() => setEditing(true)}>
            Change the time
          </button>
        )}

        {manual && (
          <label className="field">
            <span>Date</span>
            <input type="date" value={date} max={todayKey} onChange={(e) => setDate(e.target.value)} />
          </label>
        )}

        <div className="field">
          <span>Subject</span>
          <div className="chips">
            {subjects.map((s) => (
              <button
                type="button" key={s.id} className="chip"
                aria-pressed={subjectId === s.id}
                onClick={() => setSubjectId(s.id)}
              >
                <span className="dot" style={{ background: s.color }} />
                {s.name}
              </button>
            ))}
            <button
              type="button" className="chip"
              aria-pressed={subjectId === NEW}
              onClick={() => setSubjectId(NEW)}
            >
              <PlusIcon /> New
            </button>
          </div>
        </div>

        {subjectId === NEW && (
          <div className="inline">
            <input
              type="color" aria-label="New subject colour"
              value={newColor} onChange={(e) => setNewColor(e.target.value)}
            />
            <input
              type="text" placeholder="Subject name" aria-label="New subject name"
              value={newName} maxLength={40}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
        )}

        <button type="submit" className="primary wide" disabled={!canLog}>
          {chosen ? `Log to ${chosen.name}` : 'Log time'}
        </button>
        {queued > 0 && (
          <p className="muted small">
            {queued} more {queued === 1 ? 'session' : 'sessions'} waiting after this one
          </p>
        )}
      </form>
    </section>
  )
}
