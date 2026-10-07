import type { ReactElement, Ref } from 'react'
import type { CancelAction } from './CancelAction'
import { CancelRow } from './CancelRow'
import { Countdown } from './Countdown'
import { SlotIcon } from './icons/SlotIcon'
import { SlotHeading } from './SlotHeading'
import { Track } from './Track'

export type BuildSlotState =
  | { readonly kind: 'idle'; readonly title: string; readonly invitation: string }
  | {
      readonly kind: 'busy'
      readonly title: string
      readonly buildingName: string
      readonly levelLabel: string
      readonly remainingSeconds: number
      readonly time: string
      readonly totalSeconds: number
      readonly finishedLabel: string
      readonly cancel: CancelAction
      readonly refund: string | undefined
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

export function BuildSlot({
  state,
  titleRef,
}: {
  readonly state: BuildSlotState
  readonly titleRef?: Ref<HTMLSpanElement> | undefined
}): ReactElement {
  switch (state.kind) {
    case 'idle':
      return (
        <section className={`${frameClass} border-dashed border-line bg-surface text-ink-faint`}>
          <SlotHeading icon={<SlotIcon />} title={state.title} titleRef={titleRef} />
          <p className="m-0 font-body text-caption">{state.invitation}</p>
        </section>
      )
    case 'busy':
      return (
        <section className={`${frameClass} border-line-strong bg-surface-raised text-ink-muted`}>
          <SlotHeading icon={<SlotIcon />} title={state.title} titleRef={titleRef} />
          <Building
            name={state.buildingName}
            levelLabel={state.levelLabel}
            badgeTone="bg-umber text-on-umber"
          />
          <Countdown
            remainingSeconds={state.remainingSeconds}
            time={state.time}
            finishedLabel={state.finishedLabel}
          />
          <Track
            value={state.totalSeconds - state.remainingSeconds}
            total={state.totalSeconds}
            fillClass="fill-slate"
          />
          <CancelRow cancel={state.cancel} refund={state.refund} />
        </section>
      )
    case 'justFinished':
      return (
        <section className={`${frameClass} border-moss bg-moss-soft text-moss`}>
          <SlotHeading icon={<SlotIcon />} title={state.title} titleRef={titleRef} />
          <Building
            name={state.buildingName}
            levelLabel={state.levelLabel}
            badgeTone="bg-moss text-on-moss"
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
