import { type ReactElement, useId } from 'react'
import { Button } from './Button'
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
  readonly onAction?: (() => void) | undefined
}

const cardTone: Readonly<Record<CardActionState['kind'], string>> = {
  affordable: 'border border-moss bg-surface-raised',
  blocked: 'bg-surface-raised',
  atMaxLevel: 'bg-surface-sunken',
}

export const cardToneOf = (state: CardActionState): string => cardTone[state.kind]

function BlockedAction({
  type,
  label,
  reason,
  ready,
}: {
  readonly type: CardActionProps['type']
  readonly label: string
  readonly reason: string
  readonly ready: string | undefined
}): ReactElement {
  const reasonId = useId()
  return (
    <div className="flex flex-col gap-2">
      <Button type={type} tone="primary" availability="blocked" describedBy={reasonId}>
        {label}
      </Button>
      <span id={reasonId} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-body text-caption text-rust">{reason}</span>
        {ready !== undefined && (
          <>
            {' '}
            <span className="font-utility font-semibold text-caption text-ink tabular-nums">
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
  onAction,
}: CardActionProps): ReactElement {
  if (state.kind === 'atMaxLevel') {
    return (
      <Button type={type} tone="primary" availability="blocked">
        {state.label}
      </Button>
    )
  }
  if (state.kind === 'blocked') {
    return <BlockedAction type={type} label={label} reason={state.reason} ready={state.ready} />
  }
  if (isWaiting) {
    return (
      <Button type={type} tone="primary" availability="waiting">
        <ClockIcon sizeClass="size-icon" />
        <span>{label}</span>
      </Button>
    )
  }
  return (
    <Button type={type} tone="primary" onClick={onAction}>
      {label}
    </Button>
  )
}
