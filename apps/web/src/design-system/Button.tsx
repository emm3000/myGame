import type { MouseEvent, ReactElement, ReactNode } from 'react'

export type ButtonTone = 'primary' | 'quiet' | 'text'

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
  primary: 'border-action bg-action text-on-action',
  quiet: 'border-line-strong bg-transparent text-ink',
  text: 'border-transparent bg-transparent text-ink underline underline-offset-2',
}

const shapeClass: Readonly<Record<ButtonTone, string>> = {
  primary: 'min-h-action rounded-pill px-6 text-button',
  quiet: 'min-h-secondary rounded-pill px-5 text-label',
  text: 'min-h-control rounded-sm px-1 text-label',
}

const unavailableClass: Readonly<Record<Exclude<ButtonAvailability, 'available'>, string>> = {
  blocked: 'cursor-not-allowed border-dashed border-line-strong bg-surface-sunken text-ink-muted',
  waiting:
    'inline-flex cursor-progress items-center justify-center gap-2 border-line-strong bg-surface-sunken text-ink-muted',
}

const baseClass =
  'border py-2 font-sans focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus'

export const buttonClassOf = (tone: ButtonTone): string =>
  `${baseClass} ${shapeClass[tone]} cursor-pointer disabled:cursor-not-allowed disabled:border-dashed disabled:border-line disabled:bg-surface-sunken disabled:text-ink-muted ${toneClass[tone]}`

const classOf = (tone: ButtonTone, availability: ButtonAvailability): string =>
  availability === 'available'
    ? buttonClassOf(tone)
    : `${baseClass} ${shapeClass[tone]} ${unavailableClass[availability]}`

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
      data-tone={props.tone}
      className={classOf(props.tone, availability)}
    >
      {props.children}
    </button>
  )
}
