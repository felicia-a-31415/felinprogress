import type { CSSProperties } from 'react'

type Props = { value: number; label: string; onChange(value: number): void }

/** a 0-1 volume slider whose filled part follows the value */
export function Slider({ value, label, onChange }: Props) {
  return (
    <input
      className="slider"
      type="range" min={0} max={1} step={0.01}
      value={value}
      aria-label={label}
      aria-valuetext={`${Math.round(value * 100)}%`}
      style={{ '--fill': `${value * 100}%` } as CSSProperties}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  )
}
