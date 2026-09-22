import type { ReactElement } from 'react'
import { formatDuration } from './formatDuration'
import { ClockIcon } from './icons/ClockIcon'

interface CountdownProps {
  readonly remainingSeconds: number
  readonly finishedLabel: string
}

function tone(remainingSeconds: number): { readonly icon: string; readonly digits: string } {
  if (remainingSeconds <= 0) {
    return { icon: 'text-moss', digits: 'text-numeral text-moss' }
  }
  if (remainingSeconds < 60) {
    return { icon: 'text-ochre', digits: 'text-numeral-lg text-ochre' }
  }
  return { icon: 'text-ink-muted', digits: 'text-numeral-lg text-ink' }
}

export function Countdown({ remainingSeconds, finishedLabel }: CountdownProps): ReactElement {
  const { icon, digits } = tone(remainingSeconds)
  return (
    <span
      role="timer"
      className={`inline-flex items-center gap-2 font-utility tabular-nums ${icon}`}
    >
      <ClockIcon />
      <span className={digits}>
        {remainingSeconds <= 0 ? finishedLabel : formatDuration(remainingSeconds)}
      </span>
    </span>
  )
}
