import type { ReactElement } from 'react'

type NumberFieldName =
  | { readonly id: string; readonly accessibleName?: never }
  | { readonly id?: never; readonly accessibleName: string }

export type NumberFieldProps = NumberFieldName & {
  readonly min: number
  readonly max?: number | undefined
  readonly value: string
  readonly isDisabled?: boolean | undefined
  readonly onChange: (value: string) => void
}

export function NumberField(props: NumberFieldProps): ReactElement {
  return (
    <input
      id={props.id}
      type="number"
      inputMode="numeric"
      step={1}
      min={props.min}
      max={props.max}
      value={props.value}
      disabled={props.isDisabled}
      aria-label={props.accessibleName}
      onChange={(event) => props.onChange(event.target.value)}
      className="min-h-control w-numeral rounded-sm border border-line-strong bg-surface-raised px-3 py-2 font-utility text-numeral text-ink tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong disabled:cursor-not-allowed disabled:border-dashed disabled:border-line disabled:bg-surface-sunken disabled:text-ink-faint"
    />
  )
}
