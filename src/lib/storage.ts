import { isDateKey } from './time.ts'
import { SOUND_IDS } from './types.ts'
import type { Clock, LogDraft, Session, Settings, SoundMix, Subject } from './types.ts'

export type KV = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const PREFIX = 'felinprogress:v1:'

export function memoryKV(): KV {
  const map = new Map<string, string>()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => { map.set(k, v) },
    removeItem: (k) => { map.delete(k) },
  }
}

/** local storage, or an in-memory stand-in when the browser blocks it */
export function getBrowserStorage(): KV {
  try {
    const ls = window.localStorage
    ls.getItem(PREFIX + 'probe')
    return ls
  } catch {
    return memoryKV()
  }
}

function read(kv: KV, key: string): unknown {
  try {
    const raw = kv.getItem(PREFIX + key)
    return raw === null ? undefined : JSON.parse(raw)
  } catch {
    return undefined
  }
}

function write(kv: KV, key: string, value: unknown): boolean {
  try {
    kv.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function isSubject(v: unknown): v is Subject {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.color === 'string'
  )
}

function isSession(v: unknown): v is Session {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.subjectId === 'string' &&
    typeof v.seconds === 'number' &&
    Number.isFinite(v.seconds) &&
    v.seconds > 0 &&
    isDateKey(v.date)
  )
}

function num(v: unknown, fallback: number, min: number, max: number): number {
  return typeof v === 'number' && Number.isFinite(v)
    ? Math.min(max, Math.max(min, v))
    : fallback
}

export function defaultSettings(): Settings {
  const mix = {} as SoundMix
  for (const id of SOUND_IDS) mix[id] = 0
  return { theme: 'system', lastTimerSeconds: 1500, mix, masterVolume: 0.8, sidebarOpen: true, currentSubjectId: null }
}

export function loadSubjects(kv: KV): Subject[] {
  const v = read(kv, 'subjects')
  if (!Array.isArray(v)) return []
  return v.filter(isSubject).map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    ...(s.archived === true ? { archived: true } : {}),
  }))
}
export function saveSubjects(kv: KV, v: Subject[]): boolean {
  return write(kv, 'subjects', v)
}

export function loadSessions(kv: KV): Session[] {
  const v = read(kv, 'sessions')
  return Array.isArray(v) ? v.filter(isSession) : []
}
export function saveSessions(kv: KV, v: Session[]): boolean {
  return write(kv, 'sessions', v)
}

export function loadSettings(kv: KV): Settings {
  const d = defaultSettings()
  const v = read(kv, 'settings')
  if (!isRecord(v)) return d
  const mix = d.mix
  if (isRecord(v.mix)) {
    for (const id of SOUND_IDS) mix[id] = num(v.mix[id], 0, 0, 1)
  }
  return {
    theme: v.theme === 'light' || v.theme === 'dark' ? v.theme : 'system',
    lastTimerSeconds: Math.floor(num(v.lastTimerSeconds, d.lastTimerSeconds, 1, 359999)),
    mix,
    masterVolume: num(v.masterVolume, d.masterVolume, 0, 1),
    sidebarOpen: typeof v.sidebarOpen === 'boolean' ? v.sidebarOpen : d.sidebarOpen,
    currentSubjectId: typeof v.currentSubjectId === 'string' ? v.currentSubjectId : null,
  }
}
export function saveSettings(kv: KV, v: Settings): boolean {
  return write(kv, 'settings', v)
}

export function loadClock(kv: KV): Clock | null {
  const v = read(kv, 'activeClock')
  if (!isRecord(v)) return null
  if (v.mode !== 'timer' && v.mode !== 'stopwatch') return null
  const finite = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
  if (!finite(v.durationMs) || v.durationMs < 0) return null
  if (!finite(v.accumulatedMs) || v.accumulatedMs < 0) return null
  if (v.startedAt !== null && !finite(v.startedAt)) return null
  return {
    mode: v.mode,
    durationMs: v.durationMs,
    accumulatedMs: v.accumulatedMs,
    startedAt: v.startedAt,
  }
}
export function saveClock(kv: KV, v: Clock | null): boolean {
  if (v === null) {
    try {
      kv.removeItem(PREFIX + 'activeClock')
      return true
    } catch {
      return false
    }
  }
  return write(kv, 'activeClock', v)
}

function isDraft(v: unknown): v is LogDraft {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.seconds === 'number' &&
    Number.isFinite(v.seconds) &&
    v.seconds > 0 &&
    typeof v.manual === 'boolean'
  )
}

export function loadDrafts(kv: KV): LogDraft[] {
  const v = read(kv, 'pendingLogs')
  return Array.isArray(v) ? v.filter(isDraft) : []
}
/** manual-entry drafts are not kept: only real timed sessions survive a reload */
export function saveDrafts(kv: KV, v: LogDraft[]): boolean {
  return write(kv, 'pendingLogs', v.filter((d) => !d.manual))
}
