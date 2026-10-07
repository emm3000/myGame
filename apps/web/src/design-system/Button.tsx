import type { MouseEvent, ReactElement, ReactNode } from 'react'

export type ButtonTone = 'primary' | 'quiet'

export type ButtonAvailability = 'available' | 'blocked' | 'waiting'

export interface ButtonProps {
  readonly children: ReactNode
  readonly type: 'button' | 'submit'
  readonly tone: ButtonTone
  readonly disabled?: boolean
  readonly availability?: ButtonAvailability
  readonly accessibleName?: string
  readonly describedBy?: string | undefined
  readonly isExpanded?: boolean
  readonly controls?: string | undefined
  readonly onClick?: (() => void) | undefined
}

const toneClass: Readonly<Record<ButtonTone, string>> = {
  primary: 'border-umber bg-umber text-on-umber',
  quiet: 'border-line-strong bg-surface-raised text-ink',
}

const unavailableClass: Readonly<Record<Exclude<ButtonAvailability, 'available'>, string>> = {
  blocked: 'cursor-not-allowed border-dashed border-line-strong bg-surface-sunken text-ink-muted',
  waiting:
    'inline-flex cursor-progress items-center gap-2 border-line-strong bg-surface-sunken text-ink-muted',
}

const baseClass =
  'min-h-control rounded-md border px-3 py-2 font-utility text-button focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong'

export const buttonClassOf = (tone: ButtonTone): string =>
  `${baseClass} cursor-pointer disabled:cursor-not-allowed disabled:border-dashed disabled:border-line disabled:bg-surface-sunken disabled:text-ink-faint ${toneClass[tone]}`

const classOf = (tone: ButtonTone, availability: ButtonAvailability): string =>
  availability === 'available'
    ? buttonClassOf(tone)
    : `${baseClass} ${unavailableClass[availability]}`

export function Button(props: ButtonProps): ReactElement {
  const availability = props.availability ?? 'available'
  const isUnavailable = availability !== 'available'
  const press = (event: MouseEvent<HTMLButtonElement>): void => {
    if (isUnavailable) {
      event.preventDefault()
      return
    }
    props.onClick?.()
  }
  return (
    <button
      type={props.type}
      disabled={props.disabled}
      aria-disabled={isUnavailable ? true : undefined}
      aria-busy={availability === 'waiting' ? true : undefined}
      aria-label={props.accessibleName}
      aria-describedby={props.describedBy}
      aria-expanded={props.isExpanded}
      aria-controls={props.controls}
      onClick={press}
      className={classOf(props.tone, availability)}
    >
      {props.children}
    </button>
  )
}
