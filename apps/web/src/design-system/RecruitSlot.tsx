import type { ReactElement } from 'react'
import { Button } from './Button'
import type { CancelAction } from './CancelAction'
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
    }

const frameClass = 'flex flex-col gap-3 rounded-md border p-4'

export function RecruitSlot({ state }: { readonly state: RecruitSlotState }): ReactElement {
  if (state.kind === 'idle') {
    return (
      <section className={`${frameClass} border-dashed border-line bg-surface text-ink-faint`}>
        <SlotHeading icon={<SlotIcon sizeClass="size-icon" />} title={state.title} />
        <p className="m-0 font-body text-caption">{state.invitation}</p>
      </section>
    )
  }
  return (
    <section className={`${frameClass} border-line-strong bg-surface-raised text-ink-muted`}>
      <SlotHeading icon={<SlotIcon sizeClass="size-icon" />} title={state.title} />
      <p className="m-0 font-body text-body text-ink">
        <b>{state.orderHeading}</b> {state.orderLine}
      </p>
      <CountdownLine {...state.countdown} />
      <Track
        value={state.totalSeconds - state.remainingSeconds}
        total={state.totalSeconds}
        fillClass="fill-slate"
      />
      <Button
        type="button"
        tone="quiet"
        disabled={state.cancel.isWaiting}
        accessibleName={state.cancel.accessibleName}
        onClick={state.cancel.onCancel}
      >
        {state.cancel.label}
      </Button>
    </section>
  )
}
