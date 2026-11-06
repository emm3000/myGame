import { type ReactElement, useId } from 'react'
import { Button, type ButtonTone } from './Button'
import { ClockIcon } from './icons/ClockIcon'

export type CardActionState =
  | { readonly kind: 'affordable' }
  | { readonly kind: 'blocked'; readonly reason: string; readonly ready?: string | undefined }
  | { readonly kind: 'atMaxLevel'; readonly label: string }

export type OrderActionState = Exclude<CardActionState, { readonly kind: 'atMaxLevel' }>

export type MarchActionState =
  | { readonly kind: 'affordable' }
  | { readonly kind: 'blocked'; readonly reason: string }

export interface CardActionProps {
  readonly type: 'button' | 'submit'
  readonly label: string
  readonly state: CardActionState
  readonly isWaiting: boolean
  readonly tone?: ButtonTone | undefined
  readonly keepsLabelWidth?: boolean | undefined
  readonly onAction?: (() => void) | undefined
}

const cardTone: Readonly<Record<CardActionState['kind'], string>> = {
  affordable: 'border-ink bg-surface-raised',
  blocked: 'border-line bg-surface-raised',
  atMaxLevel: 'border-line bg-surface-sunken',
}

export const cardToneOf = (state: CardActionState): string => cardTone[state.kind]

function BlockedAction({
  type,
  tone,
  label,
  reason,
  ready,
}: {
  readonly type: CardActionProps['type']
  readonly tone: ButtonTone
  readonly label: string
  readonly reason: string
  readonly ready: string | undefined
}): ReactElement {
  const reasonId = useId()
  return (
    <div className="flex flex-col gap-2">
      <Button type={type} tone={tone} availability="blocked" describedBy={reasonId}>
        {label}
      </Button>
      <span id={reasonId} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-sans text-caption text-warning-ink">{reason}</span>
        {ready !== undefined && (
          <>
            {' '}
            <span className="font-sans font-semibold text-caption text-ink tabular-nums">
              {ready}
            </span>
          </>
        )}
      </span>
    </div>
  )
}

export function CardAction({
  type,
  label,
  state,
  isWaiting,
  tone = 'primary',
  keepsLabelWidth = false,
  onAction,
}: CardActionProps): ReactElement {
  if (state.kind === 'atMaxLevel') {
    return (
      <Button type={type} tone={tone} availability="blocked">
        {state.label}
      </Button>
    )
  }
  if (state.kind === 'blocked') {
    return (
      <BlockedAction
        type={type}
        tone={tone}
        label={label}
        reason={state.reason}
        ready={state.ready}
      />
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
    <Button type={type} tone={tone} onClick={onAction}>
      {label}
    </Button>
  )
}
