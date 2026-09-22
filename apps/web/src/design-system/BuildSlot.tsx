import type { ReactElement } from 'react'
import { Countdown } from './Countdown'
import { SlotIcon } from './icons/SlotIcon'
import { Track } from './Track'

export type BuildSlotState =
  | { readonly kind: 'idle'; readonly title: string; readonly invitation: string }
  | {
      readonly kind: 'busy'
      readonly title: string
      readonly buildingName: string
      readonly levelLabel: string
      readonly remainingSeconds: number
      readonly totalSeconds: number
      readonly finishedLabel: string
    }
  | {
      readonly kind: 'justFinished'
      readonly title: string
      readonly buildingName: string
      readonly levelLabel: string
      readonly message: string
    }

const frameClass = 'flex flex-col gap-3 rounded-md border p-4'
const badgeClass = 'rounded-pill px-2 font-utility text-label tabular-nums'

function SlotHeading({ title }: { readonly title: string }): ReactElement {
  return (
    <span className="flex items-center gap-2">
      <SlotIcon />
      <span className="font-utility text-label uppercase">{title}</span>
    </span>
  )
}

function Building({
  name,
  levelLabel,
  badgeTone,
}: {
  readonly name: string
  readonly levelLabel: string
  readonly badgeTone: string
}): ReactElement {
  return (
    <span className="flex items-baseline justify-between gap-2">
      <span className="font-display text-title text-ink">{name}</span>
      <span className={`${badgeClass} ${badgeTone}`}>{levelLabel}</span>
    </span>
  )
}

export function BuildSlot({ state }: { readonly state: BuildSlotState }): ReactElement {
  switch (state.kind) {
    case 'idle':
      return (
        <section className={`${frameClass} border-dashed border-line bg-surface text-ink-faint`}>
          <SlotHeading title={state.title} />
          <p className="m-0 font-body text-caption">{state.invitation}</p>
        </section>
      )
    case 'busy':
      return (
        <section className={`${frameClass} border-line-strong bg-surface-raised text-ink-muted`}>
          <SlotHeading title={state.title} />
          <Building
            name={state.buildingName}
            levelLabel={state.levelLabel}
            badgeTone="bg-umber text-on-umber"
          />
          <Countdown
            remainingSeconds={state.remainingSeconds}
            finishedLabel={state.finishedLabel}
          />
          <Track
            fraction={1 - state.remainingSeconds / state.totalSeconds}
            fillClass="fill-slate"
          />
        </section>
      )
    case 'justFinished':
      return (
        <section className={`${frameClass} border-moss bg-moss-soft text-moss`}>
          <SlotHeading title={state.title} />
          <Building
            name={state.buildingName}
            levelLabel={state.levelLabel}
            badgeTone="bg-moss text-on-umber"
          />
          <p className="m-0 font-body text-caption">{state.message}</p>
        </section>
      )
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}
