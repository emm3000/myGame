import type { ReactElement, Ref } from 'react'
import type { CancelAction } from './CancelAction'
import { CancelRow } from './CancelRow'
import { Countdown } from './Countdown'
import { SlotIcon } from './icons/SlotIcon'
import type { Label } from './Label'
import { LabelText } from './LabelText'
import { SlotHeading } from './SlotHeading'
import { Track } from './Track'

export type BuildSlotState =
  | { readonly kind: 'idle'; readonly title: Label; readonly invitation: Label }
  | {
      readonly kind: 'busy'
      readonly title: Label
      readonly buildingName: Label
      readonly levelLabel: Label | undefined
      readonly remainingSeconds: number
      readonly time: Label
      readonly totalSeconds: number
      readonly finishedLabel: Label
      readonly cancel: CancelAction
      readonly refund: Label | undefined
    }
  | {
      readonly kind: 'justFinished'
      readonly title: Label
      readonly buildingName: Label
      readonly levelLabel: Label | undefined
      readonly message: Label
    }

const frameClass = 'flex flex-col gap-3 rounded-md p-5'

function Building({
  name,
  levelLabel,
}: {
  readonly name: Label
  readonly levelLabel: Label | undefined
}): ReactElement {
  return (
    <span className="flex items-baseline justify-between gap-2">
      <span className="font-sans text-title text-ink">
        <LabelText label={name} />
      </span>
      {levelLabel !== undefined && (
        <span className="whitespace-nowrap font-sans text-caption text-ink-muted tabular-nums">
          <LabelText label={levelLabel} />
        </span>
      )}
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
        <section className={`${frameClass} border border-line bg-surface-raised text-ink-muted`}>
          <SlotHeading icon={<SlotIcon />} title={state.title} titleRef={titleRef} />
          <p className="m-0 font-sans text-caption">
            <LabelText label={state.invitation} />
          </p>
        </section>
      )
    case 'busy':
      return (
        <section className={`${frameClass} border border-line bg-surface-raised text-ink-muted`}>
          <SlotHeading icon={<SlotIcon />} title={state.title} titleRef={titleRef} />
          <Building name={state.buildingName} levelLabel={state.levelLabel} />
          <Countdown
            remainingSeconds={state.remainingSeconds}
            time={state.time}
            finishedLabel={state.finishedLabel}
          />
          <Track
            value={state.totalSeconds - state.remainingSeconds}
            total={state.totalSeconds}
            fillClass="fill-action"
          />
          <CancelRow cancel={state.cancel} refund={state.refund} />
        </section>
      )
    case 'justFinished':
      return (
        <section className={`${frameClass} border border-ink bg-surface-sunken text-ink`}>
          <SlotHeading icon={<SlotIcon />} title={state.title} titleRef={titleRef} />
          <Building name={state.buildingName} levelLabel={state.levelLabel} />
          <p className="m-0 font-sans text-caption">
            <LabelText label={state.message} />
          </p>
        </section>
      )
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}
