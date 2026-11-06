import type { ReactElement } from 'react'
import { ClockIcon } from './icons/ClockIcon'

export interface SlotCountdown {
  readonly words: string
  readonly time: string
}

export function CountdownLine({ words, time }: SlotCountdown): ReactElement {
  return (
    <span
      role="timer"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-ink-muted tabular-nums"
    >
      <ClockIcon sizeClass="size-icon" />
      <span className="text-caption">{words}</span>
      <span className="text-heading tabular-nums text-ink">{time}</span>
    </span>
  )
}
