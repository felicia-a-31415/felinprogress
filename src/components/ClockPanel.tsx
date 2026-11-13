import { useState } from 'react'
import type { ReactNode } from 'react'
import { elapsedMs, remainingMs } from '../lib/clock.ts'
import { formatClock, hmsToSeconds, secondsToHms } from '../lib/time.ts'
import type { Clock } from '../lib/types.ts'
import { DurationFields } from './DurationFields.tsx'
import { TimerCircle } from './TimerCircle.tsx'

const PRESETS = [15, 25, 45, 60]

type Props = {
  clock: Clock | null
  now: number
  lastTimerSeconds: number
  onStartTimer(seconds: number): void
  onStartStopwatch(): void
  onPause(): void
  onResume(): void
  onStop(): void
  /** shown under the buttons: the subject picker */
  children?: ReactNode
}

export function ClockPanel(props: Props) {
  const { clock, now } = props
  const [idleMode, setIdleMode] = useState<'timer' | 'stopwatch'>(clock?.mode ?? 'timer')
  const [hms, setHms] = useState(() => secondsToHms(props.lastTimerSeconds))

  const mode = clock?.mode ?? idleMode
  const chosenSeconds = hmsToSeconds(hms.h, hms.m, hms.s)
  const running = clock !== null && clock.startedAt !== null
  const settingTimer = clock === null && mode === 'timer'

  let fraction = 1
  let label = '00:00'
  if (clock?.mode === 'timer') {
    const rem = remainingMs(clock, now)
    fraction = clock.durationMs > 0 ? rem / clock.durationMs : 0
    label = formatClock(Math.ceil(rem / 1000))
  } else if (clock) {
    label = formatClock(elapsedMs(clock, now) / 1000)
  }

  return (
    <section className="clock">
      <div className="tabs" role="group" aria-label="Mode">
        <button
          aria-pressed={mode === 'timer'} disabled={clock !== null}
          onClick={() => setIdleMode('timer')}
        >
          Timer
        </button>
        <button
          aria-pressed={mode === 'stopwatch'} disabled={clock !== null}
          onClick={() => setIdleMode('stopwatch')}
        >
          Stopwatch
        </button>
      </div>

      <TimerCircle fraction={fraction}>
        {settingTimer ? (
          <DurationFields value={hms} onChange={setHms} />
        ) : (
          <span className="timer-label" role="timer" aria-label={label}>{label}</span>
        )}
      </TimerCircle>

      {settingTimer && (
        <div className="presets" role="group" aria-label="Quick durations">
          {PRESETS.map((minutes) => (
            <button
              key={minutes}
              aria-pressed={chosenSeconds === minutes * 60}
              onClick={() => setHms(secondsToHms(minutes * 60))}
            >
              {minutes} min
            </button>
          ))}
        </div>
      )}

      <div className="clock-actions">
        {clock === null && mode === 'timer' && (
          <button
            className="primary big" disabled={chosenSeconds <= 0}
            onClick={() => props.onStartTimer(chosenSeconds)}
          >
            Start
          </button>
        )}
        {clock === null && mode === 'stopwatch' && (
          <button className="primary big" onClick={props.onStartStopwatch}>Start</button>
        )}
        {clock !== null && running && <button className="big" onClick={props.onPause}>Pause</button>}
        {clock !== null && !running && (
          <button className="primary big" onClick={props.onResume}>Resume</button>
        )}
        {clock !== null && (
          <button className="ghost big" onClick={props.onStop}>
            {mode === 'timer' ? 'Cancel' : 'Stop'}
          </button>
        )}
      </div>

      {props.children}
    </section>
  )
}
