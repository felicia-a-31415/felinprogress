import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { newId } from '../lib/id.ts'
import { pruneOrphans } from '../lib/stats.ts'
import {
  loadClock, loadDrafts, loadSessions, loadSettings, loadSubjects,
  saveClock, saveDrafts, saveSessions, saveSettings, saveSubjects,
} from '../lib/storage.ts'
import type { KV } from '../lib/storage.ts'
import type { Clock, LogDraft, Session, Settings, Subject } from '../lib/types.ts'

type Update<T> = T | ((prev: T) => T)

/**
 * State that is written to storage at the moment it changes, and only then.
 * Nothing is written on page load or when another tab's change is read in,
 * so tabs cannot overwrite each other with stale copies.
 */
function usePersisted<T>(
  kv: KV,
  load: (kv: KV) => T,
  save: (kv: KV, value: T) => boolean,
  onSaveFailed: () => void,
) {
  const [value, setValue] = useState<T>(() => load(kv))
  const latest = useRef(value)

  const set = useCallback(
    (update: Update<T>) => {
      const next =
        typeof update === 'function' ? (update as (prev: T) => T)(latest.current) : update
      latest.current = next
      setValue(next)
      if (!save(kv, next)) onSaveFailed()
    },
    [kv, save, onSaveFailed],
  )

  /** re-read from storage without writing back */
  const reload = useCallback(
    (merge?: (stored: T, current: T) => T) => {
      const stored = load(kv)
      const next = merge ? merge(stored, latest.current) : stored
      latest.current = next
      setValue(next)
    },
    [kv, load],
  )

  return [value, set, reload] as const
}

export type Store = ReturnType<typeof useStore>

export function useStore(kv: KV) {
  const [saveFailed, setSaveFailed] = useState(false)
  const onSaveFailed = useCallback(() => setSaveFailed(true), [])

  const [subjects, setSubjects, reloadSubjects] = usePersisted(kv, loadSubjects, saveSubjects, onSaveFailed)
  // Stored sessions are kept as they are. Ones whose subject is missing are
  // only hidden, so a damaged subjects list cannot erase logged time.
  const [allSessions, setSessions, reloadSessions] = usePersisted(kv, loadSessions, saveSessions, onSaveFailed)
  const [settings, setSettings, reloadSettings] = usePersisted(kv, loadSettings, saveSettings, onSaveFailed)
  const [clock, setClock, reloadClock] = usePersisted<Clock | null>(kv, loadClock, saveClock, onSaveFailed)
  const [drafts, setDrafts, reloadDrafts] = usePersisted(kv, loadDrafts, saveDrafts, onSaveFailed)

  const sessions = useMemo(() => pruneOrphans(allSessions, subjects), [allSessions, subjects])

  // pick up changes made in another tab
  useEffect(() => {
    const reload = () => {
      reloadSubjects()
      reloadSessions()
      reloadSettings()
      reloadClock()
      // a manual-entry card open in this tab is not stored, so keep it
      reloadDrafts((stored, current) => [...current.filter((d) => d.manual), ...stored])
    }
    window.addEventListener('storage', reload)
    return () => window.removeEventListener('storage', reload)
  }, [reloadSubjects, reloadSessions, reloadSettings, reloadClock, reloadDrafts])

  const addSubject = useCallback(
    (name: string, color: string): Subject => {
      const subject: Subject = { id: newId(), name, color }
      setSubjects((prev) => [...prev, subject])
      return subject
    },
    [setSubjects],
  )

  const updateSubject = useCallback(
    (id: string, patch: Partial<Pick<Subject, 'name' | 'color' | 'archived'>>) => {
      setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    },
    [setSubjects],
  )

  const deleteSubject = useCallback(
    (id: string) => {
      setSubjects((prev) => prev.filter((s) => s.id !== id))
      setSessions((prev) => prev.filter((s) => s.subjectId !== id))
    },
    [setSubjects, setSessions],
  )

  const addSession = useCallback(
    (subjectId: string, seconds: number, date: string) => {
      const session: Session = { id: newId(), subjectId, seconds, date }
      setSessions((prev) => [...prev, session])
    },
    [setSessions],
  )

  const deleteSession = useCallback(
    (id: string) => setSessions((prev) => prev.filter((s) => s.id !== id)),
    [setSessions],
  )

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...patch })),
    [setSettings],
  )

  /** queue a session to log; a repeated id is ignored */
  const pushDraft = useCallback(
    (seconds: number, manual: boolean, id: string = newId()) => {
      setDrafts((prev) =>
        prev.some((d) => d.id === id) ? prev : [...prev, { id, seconds, manual } satisfies LogDraft],
      )
    },
    [setDrafts],
  )

  const closeDraft = useCallback(
    (id: string) => setDrafts((prev) => prev.filter((d) => d.id !== id)),
    [setDrafts],
  )

  return {
    subjects, sessions, settings, clock, setClock, drafts, saveFailed,
    addSubject, updateSubject, deleteSubject,
    addSession, deleteSession, updateSettings, pushDraft, closeDraft,
  }
}
