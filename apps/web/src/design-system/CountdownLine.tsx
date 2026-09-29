import type { ReactElement } from 'react'
import { formatDuration } from './formatDuration'
import { ClockIcon } from './icons/ClockIcon'

export interface SlotCountdown {
  readonly words: string
  readonly remainingSeconds: number
}

export function CountdownLine({ words, remainingSeconds }: SlotCountdown): ReactElement {
  return (
    <span
      role="timer"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 font-utility text-ink-muted tabular-nums"
    >
      <ClockIcon sizeClass="size-icon" />
      <span className="text-numeral">{words}</span>
      <span className="text-numeral-lg text-ink">{formatDuration(remainingSeconds)}</span>
    </span>
  )
}
