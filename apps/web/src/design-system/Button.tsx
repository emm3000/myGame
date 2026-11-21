import type { MouseEvent, ReactElement, ReactNode } from 'react'
import { blockFocusTargetClass, focusTargetClass } from './focusTargetClass'
import type { Label } from './Label'
import { rowLayoutClass } from './rowLayoutClass'
import { spokenLanguageOf } from './spokenLanguageOf'
import { spokenLineOf } from './spokenLineOf'

export type ActionTone = 'primary' | 'quiet' | 'text'

export type PlainTone = 'readingWord' | 'row'

export type ButtonTone = ActionTone | PlainTone

export type ButtonAvailability = 'available' | 'blocked' | 'marked' | 'waiting' | 'waitingInPlace'

interface ButtonCommonProps {
  readonly children: ReactNode
  readonly type: 'button' | 'submit'
  readonly accessibleName?: Label
  readonly describedBy?: string | undefined
  readonly isExpanded?: boolean
  readonly controls?: string | undefined
  readonly onClick?: (() => void) | undefined
}

interface ActionButtonProps extends ButtonCommonProps {
  readonly tone: ActionTone
  readonly disabled?: boolean
  readonly availability?: ButtonAvailability
}

interface PlainButtonProps extends ButtonCommonProps {
  readonly tone: PlainTone
}

export type ButtonProps = ActionButtonProps | PlainButtonProps

const isActionTone: Readonly<Record<ButtonTone, boolean>> = {
  primary: true,
  quiet: true,
  text: true,
  readingWord: false,
  row: false,
}

const isActionProps = (props: ButtonProps): props is ActionButtonProps => isActionTone[props.tone]

const toneClass: Readonly<Record<ButtonTone, string>> = {
  primary: 'border-action bg-action text-on-action',
  quiet: 'border-line-strong bg-transparent text-ink',
  text: 'border-transparent bg-transparent text-ink underline underline-offset-2',
  readingWord: 'bg-transparent text-on-block underline underline-offset-2',
  row: 'bg-transparent',
}

const shapeClass: Readonly<Record<ButtonTone, string>> = {
  primary: 'min-h-action rounded-pill text-button',
  quiet: 'min-h-secondary rounded-pill text-label',
  text: 'min-h-control min-w-12 rounded-sm text-label',
  readingWord: 'min-h-control min-w-12 rounded-sm text-reading',
  row: 'min-h-secondary rounded-sm',
}

const paddingClass: Readonly<Record<ButtonTone, string>> = {
  primary: 'px-6',
  quiet: 'px-5',
  text: 'px-1',
  readingWord: 'p-0',
  row: 'px-0',
}

const waitingClass =
  'inline-flex cursor-progress items-center justify-center border-line-strong bg-surface-sunken text-ink-muted'

const blockedClass = 'border-dashed border-line-strong bg-surface-sunken text-ink-muted'

const unavailableClass: Readonly<Record<Exclude<ButtonAvailability, 'available'>, string>> = {
  blocked: `cursor-not-allowed ${blockedClass}`,
  marked: `cursor-pointer ${blockedClass}`,
  waiting: `${waitingClass} gap-2`,
  waitingInPlace: `${waitingClass} gap-1`,
}

const actionFrameClass = `border py-2 font-sans ${focusTargetClass}`

const frameClass: Readonly<Record<ButtonTone, string>> = {
  primary: actionFrameClass,
  quiet: actionFrameClass,
  text: actionFrameClass,
  readingWord: `inline-flex items-center justify-center align-baseline border-0 font-sans ${blockFocusTargetClass}`,
  row: `${rowLayoutClass} border-0 ${focusTargetClass}`,
}

export const buttonClassOf = (tone: ButtonTone): string =>
  `${frameClass[tone]} ${shapeClass[tone]} ${paddingClass[tone]} cursor-pointer disabled:cursor-not-allowed disabled:border-dashed disabled:border-line disabled:bg-surface-sunken disabled:text-ink-muted ${toneClass[tone]}`

const paddingOf = (tone: ButtonTone, availability: ButtonAvailability): string =>
  availability === 'waitingInPlace' ? 'px-2' : paddingClass[tone]

const classOf = (tone: ButtonTone, availability: ButtonAvailability): string =>
  availability === 'available'
    ? buttonClassOf(tone)
    : `${frameClass[tone]} ${shapeClass[tone]} ${paddingOf(tone, availability)} ${unavailableClass[availability]}`

export function Button(props: ButtonProps): ReactElement {
  const action = isActionProps(props) ? props : undefined
  const availability = action?.availability ?? 'available'
  const isUnavailable = availability !== 'available'
  const isWaiting = availability === 'waiting' || availability === 'waitingInPlace'
  const isWithheld = isUnavailable && availability !== 'marked'
  const { accessibleName } = props
  const press = (event: MouseEvent<HTMLButtonElement>): void => {
    if (isWithheld) {
      event.preventDefault()
      return
    }
    props.onClick?.()
  }
  return (
    <button
      type={props.type}
      disabled={action?.disabled}
      aria-disabled={isWithheld ? true : undefined}
      aria-busy={isWaiting ? true : undefined}
      aria-label={accessibleName === undefined ? undefined : spokenLineOf(accessibleName)}
      lang={accessibleName === undefined ? undefined : spokenLanguageOf(accessibleName)}
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
