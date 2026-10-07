import type { ReactElement, ReactNode } from 'react'
import { Button } from './Button'

export type HintPlacement = 'standalone' | 'inBar'

export interface HintProps {
  readonly icon: ReactNode
  readonly line: string
  readonly dismissLabel: string
  readonly onDismiss: () => void
}

const placementClass: Readonly<Record<HintPlacement, string>> = {
  standalone: 'rounded-md border border-line bg-surface-raised px-4 py-3 shadow-card',
  inBar: 'border-t border-line pt-3',
}

export function Hint({
  icon,
  line,
  dismissLabel,
  onDismiss,
  placement,
}: HintProps & { readonly placement: HintPlacement }): ReactElement {
  return (
    <p
      role="note"
      className={`m-0 flex flex-wrap items-center gap-x-3 gap-y-2 ${placementClass[placement]}`}
    >
      <span className="flex text-ink-muted *:size-icon">{icon}</span>
      <span className="min-w-0 flex-1 font-body text-body text-ink">{line}</span>
      <Button type="button" tone="quiet" onClick={onDismiss}>
        {dismissLabel}
      </Button>
    </p>
  )
}
