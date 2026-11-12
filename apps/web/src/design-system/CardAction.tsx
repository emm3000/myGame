import { type ReactElement, useId } from 'react'
import { Button, type ButtonTone } from './Button'
import { ClockIcon } from './icons/ClockIcon'

export type CardActionState =
  | { readonly kind: 'affordable' }
  | { readonly kind: 'blocked'; readonly reason: string; readonly ready?: string | undefined }
  | { readonly kind: 'invalidEntry'; readonly reason: string }
  | { readonly kind: 'atMaxLevel'; readonly label: string }

export type OrderActionState = Exclude<CardActionState, { readonly kind: 'atMaxLevel' }>

export interface CardActionProps {
  readonly type: 'button' | 'submit'
  readonly label: string
  readonly state: CardActionState
  readonly isWaiting: boolean
  readonly tone?: ButtonTone | undefined
  readonly keepsLabelWidth?: boolean | undefined
  readonly announcesReason?: boolean | undefined
  readonly onAction?: (() => void) | undefined
}

const cardTone: Readonly<Record<CardActionState['kind'], string>> = {
  affordable: 'border-ink bg-surface-raised',
  blocked: 'border-line bg-surface-raised',
  invalidEntry: 'border-line bg-surface-raised',
  atMaxLevel: 'border-line bg-surface-sunken',
}

export const cardToneOf = (state: CardActionState): string => cardTone[state.kind]

interface ShownReason {
  readonly reason: string
  readonly ready: string | undefined
}

function shownReasonOf(state: CardActionState, isWaiting: boolean): ShownReason | undefined {
  if (state.kind === 'invalidEntry') {
    return { reason: state.reason, ready: undefined }
  }
  if (state.kind === 'blocked' && !isWaiting) {
    return { reason: state.reason, ready: state.ready }
  }
  return undefined
}

function ReasonLine({ shown }: { readonly shown: ShownReason }): ReactElement {
  return (
    <>
      <span className="font-sans text-caption text-warning-ink">{shown.reason}</span>
      {shown.ready !== undefined && (
        <>
          {' '}
          <span className="font-sans font-semibold text-caption text-ink tabular-nums">
            {shown.ready}
          </span>
        </>
      )}
    </>
  )
}

function ActionButton({
  type,
  label,
  state,
  isWaiting,
  tone,
  keepsLabelWidth,
  describedBy,
  onAction,
}: {
  readonly type: CardActionProps['type']
  readonly label: string
  readonly state: CardActionState
  readonly isWaiting: boolean
  readonly tone: ButtonTone
  readonly keepsLabelWidth: boolean
  readonly describedBy: string | undefined
  readonly onAction: (() => void) | undefined
}): ReactElement {
  if (state.kind === 'atMaxLevel') {
    return (
      <Button type={type} tone={tone} availability="blocked">
        {state.label}
      </Button>
    )
  }
  if (state.kind === 'invalidEntry') {
    return (
      <Button type={type} tone={tone} availability="blocked" describedBy={describedBy}>
        {label}
      </Button>
    )
  }
  if (isWaiting) {
    return (
      <Button type={type} tone={tone} availability={keepsLabelWidth ? 'waitingInPlace' : 'waiting'}>
        <ClockIcon sizeClass={keepsLabelWidth ? 'size-icon-small' : 'size-icon'} />
        <span>{label}</span>
      </Button>
    )
  }
  return (
    <Button
      type={type}
      tone={tone}
      availability={state.kind === 'blocked' ? 'marked' : 'available'}
      describedBy={describedBy}
      onClick={onAction}
    >
      {label}
    </Button>
  )
}

const reasonLineClass = 'flex flex-wrap items-baseline gap-x-3 gap-y-1'

export function CardAction({
  type,
  label,
  state,
  isWaiting,
  tone = 'primary',
  keepsLabelWidth = false,
  announcesReason = false,
  onAction,
}: CardActionProps): ReactElement {
  const reasonId = useId()
  const announcedId = useId()
  const shown = shownReasonOf(state, isWaiting)
  const isAnnounced = announcesReason && state.kind === 'blocked' && shown !== undefined
  const describedId = isAnnounced ? announcedId : reasonId
  const button = (
    <ActionButton
      type={type}
      label={label}
      state={state}
      isWaiting={isWaiting}
      tone={tone}
      keepsLabelWidth={keepsLabelWidth}
      describedBy={shown === undefined ? undefined : describedId}
      onAction={onAction}
    />
  )
  if (shown === undefined && !announcesReason) {
    return button
  }
  return (
    <div className="flex flex-col gap-2">
      {button}
      {shown !== undefined && !isAnnounced && (
        <span id={reasonId} className={reasonLineClass}>
          <ReasonLine shown={shown} />
        </span>
      )}
      {announcesReason && (
        <span id={announcedId} aria-live="polite" className={`${reasonLineClass} empty:absolute`}>
          {isAnnounced && <ReasonLine shown={shown} />}
        </span>
      )}
    </div>
  )
}
