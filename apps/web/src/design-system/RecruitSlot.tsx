import type { ReactElement } from 'react'
import { Button } from './Button'
import type { CancelAction } from './CancelAction'
import { formatDuration } from './formatDuration'
import { ClockIcon } from './icons/ClockIcon'
import { SlotIcon } from './icons/SlotIcon'
import { Track } from './Track'

export interface RecruitCountdown {
  readonly words: string
  readonly remainingSeconds: number
}

export type RecruitSlotState =
  | { readonly kind: 'idle'; readonly title: string; readonly invitation: string }
  | {
      readonly kind: 'busy'
      readonly title: string
      readonly orderHeading: string
      readonly orderLine: string
      readonly countdowns: ReadonlyArray<RecruitCountdown>
      readonly remainingSeconds: number
      readonly totalSeconds: number
      readonly cancel: CancelAction
    }

const frameClass = 'flex flex-col gap-3 rounded-md border p-4'

function SlotHeading({ title }: { readonly title: string }): ReactElement {
  return (
    <span className="flex items-center gap-2">
      <SlotIcon sizeClass="size-icon" />
      <span className="font-utility text-label uppercase">{title}</span>
    </span>
  )
}

function CountdownLine({ words, remainingSeconds }: RecruitCountdown): ReactElement {
  return (
    <span
      role="timer"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 font-utility text-ink-muted tabular-nums"
    >
      <ClockIcon sizeClass="size-icon" />
      <span className="text-numeral">{words}</span>
      <span className="text-numeral-lg text-ink">{formatDuration(remainingSeconds)}</span>
    </span>
  )
}

export function RecruitSlot({ state }: { readonly state: RecruitSlotState }): ReactElement {
  if (state.kind === 'idle') {
    return (
      <section className={`${frameClass} border-dashed border-line bg-surface text-ink-faint`}>
        <SlotHeading title={state.title} />
        <p className="m-0 font-body text-caption">{state.invitation}</p>
      </section>
    )
  }
  return (
    <section className={`${frameClass} border-line-strong bg-surface-raised text-ink-muted`}>
      <SlotHeading title={state.title} />
      <p className="m-0 font-body text-body text-ink">
        <b>{state.orderHeading}</b> {state.orderLine}
      </p>
      {state.countdowns.map((countdown) => (
        <CountdownLine key={countdown.words} {...countdown} />
      ))}
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
