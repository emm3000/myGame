import type { ReactElement } from 'react'
import { Countdown } from './Countdown'

export interface WaitingUpgrade {
  readonly buildingName: string
  readonly levelLabel: string
  readonly remainingSeconds: number
}

interface WaitingUpgradesProps {
  readonly title: string
  readonly upgrades: ReadonlyArray<WaitingUpgrade>
  readonly finishedLabel: string
}

export function WaitingUpgrades({
  title,
  upgrades,
  finishedLabel,
}: WaitingUpgradesProps): ReactElement {
  return (
    <section className="flex flex-col gap-2 rounded-md border border-line bg-surface p-4">
      <span className="font-utility text-label text-ink-muted uppercase">{title}</span>
      <ol aria-label={title} className="m-0 flex list-none flex-col gap-3 p-0">
        {upgrades.map(({ buildingName, levelLabel, remainingSeconds }) => (
          <li
            key={`${buildingName}-${levelLabel}`}
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <span className="flex items-baseline gap-2">
              <span className="font-display text-body text-ink">{buildingName}</span>
              <span className="rounded-pill bg-surface-raised px-2 font-utility text-label text-ink-muted tabular-nums">
                {levelLabel}
              </span>
            </span>
            <Countdown remainingSeconds={remainingSeconds} finishedLabel={finishedLabel} />
          </li>
        ))}
      </ol>
    </section>
  )
}
