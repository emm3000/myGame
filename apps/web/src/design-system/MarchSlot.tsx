import type { ReactElement } from 'react'
import { Button } from './Button'
import type { CancelAction } from './CancelAction'
import { CountdownLine, type SlotCountdown } from './CountdownLine'
import { MarchIcon } from './icons/MarchIcon'
import { type PreviewLine, PreviewLineText } from './PreviewLines'
import { SlotHeading } from './SlotHeading'
import { Track } from './Track'

export type MarchSlotState =
  | { readonly kind: 'idle'; readonly title: string; readonly invitation: string }
  | {
      readonly kind: 'busy'
      readonly title: string
      readonly phase: PreviewLine
      readonly camp: PreviewLine | null
      readonly countdown: SlotCountdown
      readonly loot: PreviewLine | null
      readonly elapsedSeconds: number
      readonly totalSeconds: number
      readonly marks: ReadonlyArray<number>
      readonly recall: CancelAction | null
    }

const frameClass = 'flex flex-col gap-3 rounded-md border p-4'

const heading = (title: string): ReactElement => (
  <SlotHeading icon={<MarchIcon sizeClass="size-icon" />} title={title} />
)

export function MarchSlot({ state }: { readonly state: MarchSlotState }): ReactElement {
  if (state.kind === 'idle') {
    return (
      <section className={`${frameClass} border-dashed border-line bg-surface text-ink-faint`}>
        {heading(state.title)}
        <p className="m-0 font-body text-caption">{state.invitation}</p>
      </section>
    )
  }
  return (
    <section className={`${frameClass} border-line-strong bg-surface-raised text-ink-muted`}>
      {heading(state.title)}
      <p className="m-0 font-body text-body text-ink">
        <PreviewLineText line={state.phase} />
      </p>
      {state.camp !== null && (
        <p className="m-0 font-body text-body text-ink">
          <PreviewLineText line={state.camp} />
        </p>
      )}
      <CountdownLine {...state.countdown} />
      {state.loot !== null && (
        <p className="m-0 font-body text-body text-ink">
          <PreviewLineText line={state.loot} />
        </p>
      )}
      <Track
        value={state.elapsedSeconds}
        total={state.totalSeconds}
        fillClass="fill-slate"
        marks={state.marks}
      />
      {state.recall !== null && (
        <Button
          type="button"
          tone="quiet"
          disabled={state.recall.isWaiting}
          accessibleName={state.recall.accessibleName}
          onClick={state.recall.onCancel}
        >
          {state.recall.label}
        </Button>
      )}
    </section>
  )
}
