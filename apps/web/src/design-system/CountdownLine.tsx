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
      className="flex flex-wrap items-center gap-x-2 gap-y-1 font-utility text-ink-muted tabular-nums"
    >
      <ClockIcon sizeClass="size-icon" />
      <span className="text-numeral">{words}</span>
      <span className="text-numeral-lg text-ink">{time}</span>
    </span>
  )
}
