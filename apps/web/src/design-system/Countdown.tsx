import type { ReactElement } from 'react'
import { ClockIcon } from './icons/ClockIcon'
import type { Label } from './Label'
import { LabelText } from './LabelText'

interface CountdownProps {
  readonly remainingSeconds: number
  readonly time: Label
  readonly finishedLabel: Label
}

function tone(remainingSeconds: number): { readonly icon: string; readonly digits: string } {
  if (remainingSeconds <= 0) {
    return { icon: 'text-ink', digits: 'text-caption text-ink' }
  }
  return { icon: 'text-ink-muted', digits: 'text-heading tabular-nums text-ink' }
}

export function Countdown({ remainingSeconds, time, finishedLabel }: CountdownProps): ReactElement {
  const { icon, digits } = tone(remainingSeconds)
  return (
    <span role="timer" className={`inline-flex items-center gap-2 font-sans tabular-nums ${icon}`}>
      <ClockIcon />
      <span className={digits}>
        {remainingSeconds <= 0 ? <LabelText label={finishedLabel} /> : <LabelText label={time} />}
      </span>
    </span>
  )
}
