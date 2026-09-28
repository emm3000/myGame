import type { SeasonKind } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { AutumnIcon } from './icons/AutumnIcon'
import { SpringIcon } from './icons/SpringIcon'
import { SummerIcon } from './icons/SummerIcon'
import { WinterIcon } from './icons/WinterIcon'

export interface SeasonLineProps {
  readonly season: SeasonKind
  readonly headerLine: string
  readonly countdownLine: string
}

const iconOf: Readonly<Record<SeasonKind, () => ReactElement>> = {
  spring: SpringIcon,
  summer: SummerIcon,
  autumn: AutumnIcon,
  winter: WinterIcon,
}

export function SeasonLine({ season, headerLine, countdownLine }: SeasonLineProps): ReactElement {
  const Icon = iconOf[season]
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
