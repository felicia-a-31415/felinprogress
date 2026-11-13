export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** 65 -> "01:05", 3725 -> "1:02:05" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${h}:${pad2(m)}:${pad2(sec)}` : `${pad2(m)}:${pad2(sec)}`
}

/** 5400 -> "1h 30m", 1500 -> "25m", 45 -> "45s" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  if (s < 60) return `${s}s`
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/** for tight spaces: 5400 -> "1:30", 1500 -> "25m", 45 -> "45s" */
export function formatCompact(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  if (s < 60) return `${s}s`
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h === 0 ? `${m}m` : `${h}:${pad2(m)}`
}

function part(v: number): number {
  return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0
}

export function hmsToSeconds(h: number, m: number, s: number): number {
  return part(h) * 3600 + part(m) * 60 + part(s)
}

export type Hms = { h: number; m: number; s: number }

export function secondsToHms(totalSeconds: number): Hms {
  const t = part(totalSeconds)
  return { h: Math.floor(t / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 }
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isDateKey(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    toDateKey(parseDateKey(v)) === v
  )
}

export function addDays(key: string, n: number): string {
  const d = parseDateKey(key)
  d.setDate(d.getDate() + n)
  return toDateKey(d)
}

/** n day keys in ascending order, ending with todayKey */
export function lastNDays(todayKey: string, n: number): string[] {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) out.push(addDays(todayKey, -i))
  return out
}

/** every day key of a month; month0 is 0-based */
export function monthKeys(year: number, month0: number): string[] {
  const count = new Date(year, month0 + 1, 0).getDate()
  const out: string[] = []
  for (let d = 1; d <= count; d++) out.push(toDateKey(new Date(year, month0, d)))
  return out
}
