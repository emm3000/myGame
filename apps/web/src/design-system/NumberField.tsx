import type { ReactElement } from 'react'

export interface NumberFieldProps {
  readonly accessibleName: string
  readonly min: number
  readonly max: number
  readonly value: string
  readonly onChange: (value: string) => void
}

export function NumberField(props: NumberFieldProps): ReactElement {
  return (
    <input
      type="number"
      inputMode="numeric"
      step={1}
      min={props.min}
      max={props.max}
      value={props.value}
      aria-label={props.accessibleName}
      onChange={(event) => props.onChange(event.target.value)}
      className="box-content w-12 rounded-sm border border-line-strong bg-surface-raised px-3 py-2 font-utility text-numeral text-ink tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong"
    />
  )
}
