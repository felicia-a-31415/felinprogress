import { useState } from 'react'
import { pad2 } from '../lib/time.ts'
import type { Hms } from '../lib/time.ts'

function toInt(raw: string, max: number): number {
  const n = Math.floor(Number(raw))
  return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0
}

type FieldProps = { value: number; max: number; label: string; onChange(value: number): void }

function Field({ value, max, label, onChange }: FieldProps) {
  // What was typed is kept as text, so the box can be empty mid-edit. If the
  // value changes from outside (a preset), the text no longer matches and
  // the value is shown instead.
  const [text, setText] = useState(pad2(value))
  const shown = toInt(text, max) === value ? text : pad2(value)
  return (
    <label>
      <input
        type="text" inputMode="numeric" autoComplete="off"
        value={shown}
        aria-label={label}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '').slice(0, 2)
          setText(raw)
          onChange(toInt(raw, max))
        }}
        onBlur={() => setText(pad2(value))}
      />
      <span>{label}</span>
    </label>
  )
}

type Props = { value: Hms; onChange(value: Hms): void }

export function DurationFields({ value, onChange }: Props) {
  return (
    <div className="duration-fields">
      <Field value={value.h} max={99} label="hr" onChange={(h) => onChange({ ...value, h })} />
      <i aria-hidden="true">:</i>
      <Field value={value.m} max={59} label="min" onChange={(m) => onChange({ ...value, m })} />
      <i aria-hidden="true">:</i>
      <Field value={value.s} max={59} label="sec" onChange={(s) => onChange({ ...value, s })} />
    </div>
  )
}
