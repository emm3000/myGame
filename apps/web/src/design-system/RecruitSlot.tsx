import type { ReactElement, Ref } from 'react'
import type { CancelAction } from './CancelAction'
import { CancelRow } from './CancelRow'
import { CountdownLine, type SlotCountdown } from './CountdownLine'
import { SlotIcon } from './icons/SlotIcon'
import { SlotHeading } from './SlotHeading'
import { Track } from './Track'

export type RecruitSlotState =
  | { readonly kind: 'idle'; readonly title: string; readonly invitation: string }
  | {
      readonly kind: 'busy'
      readonly title: string
      readonly orderHeading: string
      readonly orderLine: string
      readonly countdown: SlotCountdown
      readonly remainingSeconds: number
      readonly totalSeconds: number
      readonly cancel: CancelAction
      readonly refund: string
    }

const frameClass = 'flex flex-col gap-3 rounded-md border p-4'

export function RecruitSlot({
  state,
  titleRef,
}: {
  readonly state: RecruitSlotState
  readonly titleRef?: Ref<HTMLSpanElement> | undefined
}): ReactElement {
  if (state.kind === 'idle') {
    return (
      <section className={`${frameClass} border-dashed border-line bg-surface text-ink-faint`}>
        <SlotHeading
          icon={<SlotIcon sizeClass="size-icon" />}
          title={state.title}
          titleRef={titleRef}
        />
        <p className="m-0 font-body text-caption">{state.invitation}</p>
      </section>
    )
  }
  return (
    <section className={`${frameClass} border-line-strong bg-surface-raised text-ink-muted`}>
      <SlotHeading
        icon={<SlotIcon sizeClass="size-icon" />}
        title={state.title}
        titleRef={titleRef}
      />
      <p className="m-0 font-body text-body text-ink">
        <b>{state.orderHeading}</b> {state.orderLine}
      </p>
      <CountdownLine {...state.countdown} />
      <Track
        value={state.totalSeconds - state.remainingSeconds}
        total={state.totalSeconds}
        fillClass="fill-slate"
      />
      <CancelRow cancel={state.cancel} refund={state.refund} />
    </section>
  )
}
