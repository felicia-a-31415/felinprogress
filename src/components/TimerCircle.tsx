import type { ReactNode } from 'react'

const R = 24
const C = 2 * Math.PI * R

type Props = { fraction: number; children: ReactNode }

/**
 * A filled circle that empties clockwise from the top. The pie is one
 * circle drawn with a very thick dashed stroke; the dash length is the
 * remaining fraction.
 */
export function TimerCircle({ fraction, children }: Props) {
  const f = Math.min(1, Math.max(0, fraction))
  return (
    <div className="timer-circle">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="track" cx="50" cy="50" r="48" />
        <circle
          className="pie" cx="50" cy="50" r={R}
          strokeWidth={R * 2}
          strokeDasharray={`${f * C} ${C}`}
          transform="translate(100 0) scale(-1 1) rotate(-90 50 50)"
        />
      </svg>
      <div className="timer-center">{children}</div>
    </div>
  )
}
