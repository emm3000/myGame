import type { ReactElement } from 'react'
import type { CancelAction } from './CancelAction'
import { CancelRow } from './CancelRow'
import { Countdown } from './Countdown'
import type { Label } from './Label'
import { LabelText } from './LabelText'
import { spokenLineOf } from './spokenLineOf'

export interface WaitingUpgrade {
  readonly buildingName: Label
  readonly levelLabel: Label
  readonly remainingSeconds: number
  readonly time: Label
  readonly cancel: CancelAction
  readonly refund: Label
}

interface WaitingUpgradesProps {
  readonly title: Label
  readonly emptiesAt: Label
  readonly upgrades: ReadonlyArray<WaitingUpgrade>
  readonly finishedLabel: Label
}

export function WaitingUpgrades({
  title,
  emptiesAt,
  upgrades,
  finishedLabel,
}: WaitingUpgradesProps): ReactElement {
  return (
    <section className="flex flex-col gap-2 rounded-md border border-line bg-surface-raised p-5">
      <span className="font-sans text-ink-muted tabular-nums">
        <span className="text-label">
          <LabelText label={title} />
        </span>
        <span className="text-caption">
          {' · '}
          <LabelText label={emptiesAt} />
        </span>
      </span>
      <ol aria-label={spokenLineOf(title)} className="m-0 flex list-none flex-col gap-3 p-0">
        {upgrades.map(({ buildingName, levelLabel, remainingSeconds, time, cancel, refund }) => (
          <li key={`${buildingName.text}-${levelLabel.text}`} className="flex flex-col gap-2">
            <span className="flex flex-wrap items-center justify-between gap-2 self-stretch">
              <span className="flex items-baseline gap-2">
                <span className="font-sans text-body text-ink">
                  <LabelText label={buildingName} />
                </span>
                <span className="whitespace-nowrap font-sans text-caption text-ink-muted tabular-nums">
                  <LabelText label={levelLabel} />
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
