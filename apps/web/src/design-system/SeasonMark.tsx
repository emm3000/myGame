import type { SeasonKind } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { seasonIconOf } from './seasonIconOf'

export interface SeasonMarkProps {
  readonly season: SeasonKind
  readonly words: string
}

export function SeasonMark({ season, words }: SeasonMarkProps): ReactElement {
  const Icon = seasonIconOf[season]
  return (
    <span className="flex flex-wrap items-center gap-x-1 self-start rounded-sm bg-surface-sunken px-2 font-utility font-semibold text-caption text-ink tabular-nums">
      <span className="flex text-ink-muted">
        <Icon />
      </span>
      <span>{words}</span>
    </span>
  )
}
