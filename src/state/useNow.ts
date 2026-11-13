import { useEffect, useState } from 'react'

/** current time in ms, refreshed about 4 times a second while active */
export function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!active) return
    const tick = () => setNow(Date.now())
    let worker: Worker | null = null
    let interval: number | undefined
    const startInterval = () => {
      if (interval === undefined) interval = window.setInterval(tick, 250)
    }
    // A worker keeps ticking on time in a hidden tab. If it cannot start
    // or fails to load, fall back to an ordinary page timer.
    try {
      worker = new Worker(new URL('../lib/tick.worker.ts', import.meta.url), {
        type: 'module',
      })
      worker.onmessage = tick
      worker.onerror = startInterval
    } catch {
      startInterval()
    }
    document.addEventListener('visibilitychange', tick)
    return () => {
      worker?.terminate()
      if (interval !== undefined) window.clearInterval(interval)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [active])

  return now
}
