import type { ReactElement } from 'react'
import { Button } from './Button'
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

export function CardAction({
  state,
  actionLabel,
  durationSeconds,
  isWaiting,
  onAction,
}: CardActionProps): ReactElement {
  if (state.kind === 'atMaxLevel') {
    return (
      <Button type="button" tone="primary" disabled>
        {state.label}
      </Button>
    )
  }
  const label = `${actionLabel} · ${formatDuration(durationSeconds)}`
  if (state.kind === 'affordable') {
    return (
      <Button type="button" tone="primary" disabled={isWaiting} onClick={onAction}>
        {label}
      </Button>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <Button type="button" tone="primary" disabled accessibleName={`${label}. ${state.reason}`}>
        {label}
      </Button>
      <span className="font-body text-caption text-rust">{state.reason}</span>
    </div>
  )
}
