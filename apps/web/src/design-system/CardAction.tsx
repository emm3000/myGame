import type { ReactElement } from 'react'
import { formatDuration } from './formatDuration'

export type CardActionState =
  | { readonly kind: 'affordable' }
  | { readonly kind: 'blocked'; readonly reason: string }
  | { readonly kind: 'atMaxLevel'; readonly label: string }

export interface CardActionProps {
  readonly state: CardActionState
  readonly actionLabel: string
  readonly durationSeconds: number
  readonly isWaiting: boolean
  readonly onAction: (() => void) | undefined
}

const cardTone: Readonly<Record<CardActionState['kind'], string>> = {
  affordable: 'border-moss bg-surface-raised',
  blocked: 'border-line bg-surface-raised',
  atMaxLevel: 'border-line bg-surface-sunken',
}

export const cardToneOf = (state: CardActionState): string => cardTone[state.kind]

function ActionButton({
  label,
  accessibleName,
  isEnabled,
  onAction,
}: {
  readonly label: string
  readonly accessibleName?: string
  readonly isEnabled: boolean
  readonly onAction?: (() => void) | undefined
}): ReactElement {
  return (
    <button
      type="button"
      aria-label={accessibleName}
      disabled={!isEnabled}
      onClick={onAction}
      className="cursor-pointer rounded-md border border-umber bg-umber px-3 py-2 font-utility text-button text-on-umber focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-sunken disabled:text-ink-faint"
    >
      {label}
    </button>
  )
}

export function CardAction({
  state,
  actionLabel,
  durationSeconds,
  isWaiting,
  onAction,
}: CardActionProps): ReactElement {
  if (state.kind === 'atMaxLevel') {
    return <ActionButton label={state.label} isEnabled={false} />
  }
  const label = `${actionLabel} · ${formatDuration(durationSeconds)}`
  if (state.kind === 'affordable') {
    return <ActionButton label={label} isEnabled={!isWaiting} onAction={onAction} />
  }
  return (
    <div className="flex flex-col gap-2">
      <ActionButton label={label} accessibleName={`${label}. ${state.reason}`} isEnabled={false} />
      <span className="font-body text-caption text-rust">{state.reason}</span>
    </div>
  )
}
