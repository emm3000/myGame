import type { UnitKind } from '@mygame/contracts'
import { type FormEvent, type ReactElement, useId } from 'react'
import { cardToneOf } from './CardAction'
import { type CardCost, CostList } from './CostList'
import { NumberField } from './NumberField'
import { Panel } from './Panel'
import { SubmitAction, type SubmitActionState } from './SubmitAction'
import { UnitCardHeader } from './UnitCardHeader'
import type { UnitTally } from './UnitCount'

export interface UnitCardProps {
  readonly unit: UnitKind
  readonly name: string
  readonly tallies: ReadonlyArray<UnitTally>
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
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (props.state.kind === 'affordable' && !props.isWaiting) {
      props.onRecruit()
    }
  }
  return (
    <Panel element="article" toneClass={cardToneOf(props.state)} spacingClass="gap-3 p-4">
      <UnitCardHeader
        unit={props.unit}
        name={props.name}
        tallies={props.tallies}
        titleElement={props.titleElement}
      />
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
