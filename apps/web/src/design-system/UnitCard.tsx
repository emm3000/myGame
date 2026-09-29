import { type FormEvent, type ReactElement, useId } from 'react'
import { cardToneOf } from './CardAction'
import { type CardCost, CostList } from './CostList'
import { NumberField } from './NumberField'
import { Panel } from './Panel'
import { SubmitAction, type SubmitActionState } from './SubmitAction'
import { UnitCount } from './UnitCount'

export interface UnitCardProps {
  readonly name: string
  readonly count: number
  readonly countLabel: string
  readonly fieldLabel: string
  readonly entry: string
  readonly isFieldDisabled: boolean
  readonly costs: ReadonlyArray<CardCost> | undefined
  readonly actionLabel: string
  readonly state: SubmitActionState
  readonly titleElement: 'h3' | 'h4'
  readonly isWaiting: boolean
  readonly onEntryChange: (entry: string) => void
  readonly onRecruit: () => void
}

export function UnitCard(props: UnitCardProps): ReactElement {
  const fieldId = useId()
  const { titleElement: Title } = props
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (props.state.kind === 'affordable' && !props.isWaiting) {
      props.onRecruit()
    }
  }
  return (
    <Panel element="article" toneClass={cardToneOf(props.state)} spacingClass="gap-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Title className="m-0 font-display text-title text-ink">{props.name}</Title>
        <UnitCount count={props.count} label={props.countLabel} />
      </header>
      <form className="m-0 flex flex-col gap-3" onSubmit={submit}>
        <div className="flex flex-col gap-1">
          <label htmlFor={fieldId} className="font-utility text-label text-ink-muted uppercase">
            {props.fieldLabel}
          </label>
          <NumberField
            id={fieldId}
            min={1}
            value={props.entry}
            isDisabled={props.isFieldDisabled}
            onChange={props.onEntryChange}
          />
        </div>
        {props.costs !== undefined && <CostList costs={props.costs} />}
        <SubmitAction label={props.actionLabel} state={props.state} isWaiting={props.isWaiting} />
      </form>
    </Panel>
  )
}
