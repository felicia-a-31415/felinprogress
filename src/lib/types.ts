export const SOUND_IDS = [
  'white', 'pink', 'brown',
  'rain', 'heavyRain', 'window', 'thunder',
  'wind', 'waves', 'river', 'fire', 'birds', 'crickets',
  'cafe', 'library', 'keyboard', 'fan',
] as const
export type SoundId = (typeof SOUND_IDS)[number]

/** an archived subject keeps its logged time but is no longer offered for new sessions */
export type Subject = { id: string; name: string; color: string; archived?: boolean }

/** date is a local day key, YYYY-MM-DD */
export type Session = { id: string; subjectId: string; seconds: number; date: string }

/** a finished or stopped session waiting to be logged or discarded */
export type LogDraft = { id: string; seconds: number; manual: boolean }

/** volume per sound, 0 to 1; 0 means off */
export type SoundMix = Record<SoundId, number>

/** 'system' follows the device's light or dark setting */
export type Theme = 'system' | 'light' | 'dark'

export type Settings = {
  theme: Theme
  lastTimerSeconds: number
  mix: SoundMix
  masterVolume: number
  sidebarOpen: boolean
  /** the subject picked on the timer screen, offered first when logging */
  currentSubjectId: string | null
}

/**
 * A running or paused timer/stopwatch.
 * accumulatedMs: time counted before the current run.
 * startedAt: epoch ms the current run began, or null when paused.
 * durationMs: timer length; 0 for a stopwatch.
 */
export type Clock = {
  mode: 'timer' | 'stopwatch'
  durationMs: number
  accumulatedMs: number
  startedAt: number | null
}
