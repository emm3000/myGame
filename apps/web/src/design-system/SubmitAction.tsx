import type { ReactElement } from 'react'
import { Button } from './Button'
import type { CardActionState } from './CardAction'

export type SubmitActionState = Exclude<CardActionState, { readonly kind: 'atMaxLevel' }>

export interface SubmitActionProps {
  readonly label: string
  readonly state: SubmitActionState
  readonly isWaiting: boolean
}

export function SubmitAction({ label, state, isWaiting }: SubmitActionProps): ReactElement {
  if (state.kind === 'affordable') {
    return (
      <Button type="submit" tone="primary" disabled={isWaiting}>
        {label}
      </Button>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <Button type="submit" tone="primary" disabled accessibleName={`${label}. ${state.reason}`}>
        {label}
      </Button>
      <span className="font-body text-caption text-rust">{state.reason}</span>
    </div>
  )
}
