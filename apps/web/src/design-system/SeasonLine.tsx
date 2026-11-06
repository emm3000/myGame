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
    <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 overflow-hidden font-sans text-caption text-ink">
      <span className="flex items-center gap-2">
        <span className="flex text-ink-muted">
          <Icon />
        </span>
        <span>{headerLine}</span>
      </span>
      <span className="relative">
        <span aria-hidden="true" className="absolute right-full mr-1 text-ink-muted">
          ·
        </span>
        <span role="timer" className="text-ink-muted tabular-nums">
          {countdownLine}
        </span>
      </span>
    </p>
  )
}
