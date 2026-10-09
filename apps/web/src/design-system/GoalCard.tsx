import { type ReactElement, useId } from 'react'
import { Button } from './Button'
import { FormAlert } from './FormAlert'
import { Panel } from './Panel'

export type GoalStateTone = 'short' | 'underway' | 'ready'

export interface GoalStateLine {
  readonly text: string
  readonly tone: GoalStateTone
}

export interface GoalCardProps {
  readonly title: string
  readonly position: string
  readonly goal: string
  readonly stateLines: ReadonlyArray<GoalStateLine>
  readonly dismissLabel: string
  readonly isWaiting: boolean
  readonly refusal: string | undefined
  readonly onDismiss: () => void
}

const toneClass: Readonly<Record<GoalStateTone, string>> = {
  short: 'text-rust',
  underway: 'text-ink-muted',
  ready: 'text-ink',
}

export function GoalCard({
  title,
  position,
  goal,
  stateLines,
  dismissLabel,
  isWaiting,
  refusal,
  onDismiss,
}: GoalCardProps): ReactElement {
  const titleId = useId()
  return (
    <Panel
      element="article"
      labelledBy={titleId}
      toneClass="bg-surface-raised"
      spacingClass="gap-3 p-5"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={titleId} className="m-0 font-display text-ink text-title">
          {title}
        </h3>
        <span className="font-utility text-ink-muted text-numeral tabular-nums">{position}</span>
      </header>
      <p className="m-0 font-body text-heading text-ink">{goal}</p>
      <div className="flex flex-col gap-1">
        {stateLines.map((line) => (
          <p key={line.text} className={`m-0 font-body text-body ${toneClass[line.tone]}`}>
            {line.text}
          </p>
        ))}
      </div>
      {refusal !== undefined && <FormAlert message={refusal} />}
      <div className="flex">
        <Button
          type="button"
          tone="quiet"
          availability={isWaiting ? 'waiting' : 'available'}
          onClick={onDismiss}
        >
          {dismissLabel}
        </Button>
      </div>
    </Panel>
  )
}
