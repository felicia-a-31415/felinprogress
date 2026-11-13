import { describe, expect, it } from 'vitest'
import {
  defaultSettings, loadClock, loadDrafts, saveDrafts, loadSessions, loadSettings, loadSubjects,
  memoryKV, saveClock, saveSessions, saveSettings, saveSubjects,
} from './storage.ts'
import type { KV } from './storage.ts'

const P = 'felinprogress:v1:'

describe('storage', () => {
  it('returns empty defaults when nothing is stored', () => {
    const kv = memoryKV()
    expect(loadSubjects(kv)).toEqual([])
    expect(loadSessions(kv)).toEqual([])
    expect(loadSettings(kv)).toEqual(defaultSettings())
    expect(loadClock(kv)).toBeNull()
  })

  it('returns defaults for corrupt JSON', () => {
    const kv = memoryKV()
    for (const k of ['subjects', 'sessions', 'settings', 'activeClock']) {
      kv.setItem(P + k, '{not json')
    }
    expect(loadSubjects(kv)).toEqual([])
    expect(loadSessions(kv)).toEqual([])
    expect(loadSettings(kv)).toEqual(defaultSettings())
    expect(loadClock(kv)).toBeNull()
  })

  it('drops entries with the wrong shape', () => {
    const kv = memoryKV()
    kv.setItem(P + 'subjects', JSON.stringify([
      { id: 'a', name: 'Math', color: '#ff0000' }, { id: 1 }, null, 'x',
    ]))
    kv.setItem(P + 'sessions', JSON.stringify([
      { id: 's1', subjectId: 'a', seconds: 600, date: '2026-11-10' },
      { id: 's2', subjectId: 'a', seconds: -5, date: '2026-11-10' },
      { id: 's3', subjectId: 'a', seconds: 600, date: 'yesterday' },
      { id: 's4', subjectId: 'a', seconds: 'abc', date: '2026-11-10' },
    ]))
    expect(loadSubjects(kv)).toEqual([{ id: 'a', name: 'Math', color: '#ff0000' }])
    expect(loadSessions(kv).map((s) => s.id)).toEqual(['s1'])
  })

  it('returns [] when a list key holds a non-array', () => {
    const kv = memoryKV()
    kv.setItem(P + 'subjects', '{"a":1}')
    expect(loadSubjects(kv)).toEqual([])
  })

  it('round-trips subjects, sessions, settings and clock', () => {
    const kv = memoryKV()
    const subjects = [{ id: 'a', name: 'Math', color: '#ff0000' }]
    const sessions = [{ id: 's1', subjectId: 'a', seconds: 600, date: '2026-11-10' }]
    const settings = { ...defaultSettings(), lastTimerSeconds: 900, sidebarOpen: false }
    const clock = { mode: 'timer' as const, durationMs: 60000, accumulatedMs: 0, startedAt: 123 }
    expect(saveSubjects(kv, subjects)).toBe(true)
    saveSessions(kv, sessions)
    saveSettings(kv, settings)
    saveClock(kv, clock)
    expect(loadSubjects(kv)).toEqual(subjects)
    expect(loadSessions(kv)).toEqual(sessions)
    expect(loadSettings(kv)).toEqual(settings)
    expect(loadClock(kv)).toEqual(clock)
  })

  it('merges partial settings with defaults and clamps numbers', () => {
    const kv = memoryKV()
    kv.setItem(P + 'settings', JSON.stringify({
      lastTimerSeconds: 600, masterVolume: 9, mix: { rain: 0.3, wind: 'bad', waves: 7 },
    }))
    const s = loadSettings(kv)
    expect(s.lastTimerSeconds).toBe(600)
    expect(s.masterVolume).toBe(1)
    expect(s.sidebarOpen).toBe(true)
    expect(s.currentSubjectId).toBeNull()
    expect(s.theme).toBe('system')
    kv.setItem(P + 'settings', JSON.stringify({ theme: 'dark' }))
    expect(loadSettings(kv).theme).toBe('dark')
    kv.setItem(P + 'settings', JSON.stringify({ theme: 'neon' }))
    expect(loadSettings(kv).theme).toBe('system')
    kv.setItem(P + 'settings', JSON.stringify({ currentSubjectId: 'abc' }))
    expect(loadSettings(kv).currentSubjectId).toBe('abc')
    kv.setItem(P + 'settings', JSON.stringify({ currentSubjectId: 42 }))
    expect(loadSettings(kv).currentSubjectId).toBeNull()
    expect(s.mix.rain).toBe(0.3)
    expect(s.mix.wind).toBe(0)
    expect(s.mix.waves).toBe(1)
    expect(Object.values(defaultSettings().mix).every((v) => v === 0)).toBe(true)
  })

  it('rejects an invalid clock and clears on null', () => {
    const kv = memoryKV()
    kv.setItem(P + 'activeClock', JSON.stringify({ mode: 'sundial', durationMs: 1 }))
    expect(loadClock(kv)).toBeNull()
    saveClock(kv, { mode: 'stopwatch', durationMs: 0, accumulatedMs: 5, startedAt: null })
    expect(loadClock(kv)).not.toBeNull()
    saveClock(kv, null)
    expect(loadClock(kv)).toBeNull()
  })

  it('does not throw when storage refuses writes or reads', () => {
    const broken: KV = {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('full') },
      removeItem: () => { throw new Error('denied') },
    }
    expect(saveSubjects(broken, [])).toBe(false)
    expect(saveClock(broken, null)).toBe(false)
    expect(loadSubjects(broken)).toEqual([])
    expect(loadSettings(broken)).toEqual(defaultSettings())
  })

  it('keeps timer drafts across reloads but not manual ones', () => {
    const kv = memoryKV()
    expect(loadDrafts(kv)).toEqual([])
    saveDrafts(kv, [
      { id: 't1', seconds: 1500, manual: false },
      { id: 'm1', seconds: 1800, manual: true },
    ])
    expect(loadDrafts(kv)).toEqual([{ id: 't1', seconds: 1500, manual: false }])
  })

  it('drops invalid drafts', () => {
    const kv = memoryKV()
    kv.setItem(P + 'pendingLogs', JSON.stringify([
      { id: 't1', seconds: 0, manual: false }, { id: 2, seconds: 5, manual: false }, 'x',
      { id: 't2', seconds: 60, manual: false },
    ]))
    expect(loadDrafts(kv).map((d) => d.id)).toEqual(['t2'])
    kv.setItem(P + 'pendingLogs', 'nope')
    expect(loadDrafts(kv)).toEqual([])
  })

  it('keeps the archived flag on subjects and ignores a bad one', () => {
    const kv = memoryKV()
    saveSubjects(kv, [
      { id: 'a', name: 'Math', color: '#ff0000', archived: true },
      { id: 'b', name: 'Bio', color: '#00ff00' },
    ])
    expect(loadSubjects(kv)).toEqual([
      { id: 'a', name: 'Math', color: '#ff0000', archived: true },
      { id: 'b', name: 'Bio', color: '#00ff00' },
    ])
    kv.setItem(P + 'subjects', JSON.stringify([{ id: 'c', name: 'Art', color: '#0000ff', archived: 'yes' }]))
    expect(loadSubjects(kv)).toEqual([{ id: 'c', name: 'Art', color: '#0000ff' }])
  })
})
