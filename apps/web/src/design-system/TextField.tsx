import { type ReactElement, useId } from 'react'

export interface TextFieldProps {
  readonly label: string
  readonly name: string
  readonly type: 'email' | 'password' | 'text'
  readonly autoComplete: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly hint?: string | undefined
  readonly error?: string | undefined
}

export function TextField(props: TextFieldProps): ReactElement {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [props.hint && hintId, props.error && errorId].filter(Boolean).join(' ')
  const hasError = props.error !== undefined
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-utility text-label uppercase text-ink-muted">
        {props.label}
      </label>
      <input
        id={id}
        name={props.name}
        type={props.type}
        autoComplete={props.autoComplete}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        aria-invalid={hasError}
        aria-describedby={describedBy === '' ? undefined : describedBy}
        className={`rounded-md border bg-surface-raised px-3 py-2 font-body text-body text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong ${hasError ? 'border-rust' : 'border-line-strong'}`}
      />
      {props.hint === undefined ? null : (
        <span id={hintId} className="font-body text-caption text-ink-muted">
          {props.hint}
        </span>
      )}
      {props.error === undefined ? null : (
        <span id={errorId} className="font-body text-caption text-rust">
          {props.error}
        </span>
      )}
    </div>
  )
}
