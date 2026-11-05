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
  readonly isDisabled?: boolean | undefined
  readonly maxLength?: number | undefined
  readonly lang?: string | undefined
}

export function TextField(props: TextFieldProps): ReactElement {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [props.hint && hintId, props.error && errorId].filter(Boolean).join(' ')
  const hasError = props.error !== undefined
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-sans text-label text-ink-muted">
        {props.label}
      </label>
      <input
        id={id}
        name={props.name}
        type={props.type}
        autoComplete={props.autoComplete}
        value={props.value}
        disabled={props.isDisabled}
        maxLength={props.maxLength}
        lang={props.lang}
        onChange={(event) => props.onChange(event.target.value)}
        aria-invalid={hasError}
        aria-describedby={describedBy === '' ? undefined : describedBy}
        className={`min-h-control rounded-md border bg-surface-raised px-3 py-2 font-sans text-body text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus ${hasError ? 'border-miss' : 'border-line-strong'}`}
      />
      {props.hint === undefined ? null : (
        <span id={hintId} className="font-sans text-caption text-ink-muted">
          {props.hint}
        </span>
      )}
      {props.error === undefined ? null : (
        <span id={errorId} className="font-sans text-caption text-miss">
          {props.error}
        </span>
      )}
    </div>
  )
}
