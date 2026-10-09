import type { ReactElement } from 'react'
import type { CancelAction } from './CancelAction'
import { CancelRow } from './CancelRow'
import { Countdown } from './Countdown'

export interface WaitingUpgrade {
  readonly buildingName: string
  readonly levelLabel: string
  readonly remainingSeconds: number
  readonly time: string
  readonly cancel: CancelAction
  readonly refund: string
}

interface WaitingUpgradesProps {
  readonly title: string
  readonly emptiesAt: string
  readonly upgrades: ReadonlyArray<WaitingUpgrade>
  readonly finishedLabel: string
}

export function WaitingUpgrades({
  title,
  emptiesAt,
  upgrades,
  finishedLabel,
}: WaitingUpgradesProps): ReactElement {
  return (
    <section className="flex flex-col gap-2 rounded-md border border-line bg-surface p-5">
      <span className="font-utility text-ink-muted tabular-nums">
        <span className="text-label uppercase">{title}</span>
        <span className="text-numeral">{` · ${emptiesAt}`}</span>
      </span>
      <ol aria-label={title} className="m-0 flex list-none flex-col gap-3 p-0">
        {upgrades.map(({ buildingName, levelLabel, remainingSeconds, time, cancel, refund }) => (
          <li key={`${buildingName}-${levelLabel}`} className="flex flex-col gap-2">
            <span className="flex flex-wrap items-center justify-between gap-2 self-stretch">
              <span className="flex items-baseline gap-2">
                <span className="font-display text-body text-ink">{buildingName}</span>
                <span className="rounded-pill bg-surface-sunken px-2 font-utility text-label text-ink tabular-nums">
                  {levelLabel}
                </span>
              </span>
              <Countdown
                remainingSeconds={remainingSeconds}
                time={time}
                finishedLabel={finishedLabel}
              />
            </span>
            <CancelRow cancel={cancel} refund={refund} />
          </li>
        ))}
      </ol>
    </section>
  )
}
