import type { SeasonKind } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { seasonIconOf } from './seasonIconOf'

export interface SeasonLineProps {
  readonly season: SeasonKind
  readonly headerLine: string
  readonly countdownLine: string
}

export function SeasonLine({ season, headerLine, countdownLine }: SeasonLineProps): ReactElement {
  const Icon = seasonIconOf[season]
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 font-utility text-numeral text-ink tabular-nums">
      <span className="flex text-ink-muted">
        <Icon />
      </span>
      <span>{headerLine}</span>
      <span aria-hidden="true" className="text-ink-muted">
        ·
      </span>
      <span role="timer" className="text-ink-muted">
        {countdownLine}
      </span>
    </p>
  )
}
