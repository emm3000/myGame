import { type FormEvent, type ReactElement, useId } from 'react'
import { Button } from './Button'
import { type CardActionState, cardToneOf } from './CardAction'
import { type CardCost, CostList } from './CostList'
import { formatQuantity } from './formatQuantity'
import { InfantryIcon } from './icons/InfantryIcon'
import { NumberField } from './NumberField'
import { Panel } from './Panel'

export type UnitCardState = Exclude<CardActionState, { readonly kind: 'atMaxLevel' }>

export interface UnitCardProps {
  readonly name: string
  readonly count: number
  readonly countLabel: string
  readonly fieldLabel: string
  readonly entry: string
  readonly isFieldDisabled: boolean
  readonly costs: ReadonlyArray<CardCost> | undefined
  readonly actionLabel: string
  readonly state: UnitCardState
  readonly titleElement: 'h3' | 'h4'
  readonly isWaiting: boolean
  readonly onEntryChange: (entry: string) => void
  readonly onRecruit: () => void
}

function UnitCount({
  count,
  label,
}: {
  readonly count: number
  readonly label: string
}): ReactElement {
  return (
    <span className="flex items-center gap-1 font-utility text-ink tabular-nums">
      <span className="flex text-ink-muted">
        <InfantryIcon />
      </span>
      <span className="whitespace-nowrap text-numeral-lg">
        {formatQuantity(count)} <span className="text-numeral text-ink-muted">{label}</span>
      </span>
    </span>
  )
}

function RecruitAction({
  label,
  state,
  isWaiting,
}: {
  readonly label: string
  readonly state: UnitCardState
  readonly isWaiting: boolean
}): ReactElement {
  if (state.kind === 'affordable') {
    return (
      <Button type="submit" tone="primary" disabled={isWaiting}>
        {label}
      </Button>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <Button type="submit" tone="primary" disabled accessibleName={`${label}. ${state.reason}`}>
        {label}
      </Button>
      <span className="font-body text-caption text-rust">{state.reason}</span>
    </div>
  )
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
        <RecruitAction label={props.actionLabel} state={props.state} isWaiting={props.isWaiting} />
      </form>
    </Panel>
  )
}
