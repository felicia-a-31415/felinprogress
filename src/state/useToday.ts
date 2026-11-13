import { useEffect, useState } from 'react'
import { toDateKey } from '../lib/time.ts'

/** today's day key, kept current across midnight and after the tab was hidden */
export function useToday(): string {
  const [key, setKey] = useState(() => toDateKey(new Date()))

  useEffect(() => {
    let timer: number | undefined
    const refresh = () => setKey(toDateKey(new Date()))
    const schedule = () => {
      const now = new Date()
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1)
      timer = window.setTimeout(() => {
        refresh()
        schedule()
      }, next.getTime() - now.getTime())
    }
    schedule()
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  return key
}
