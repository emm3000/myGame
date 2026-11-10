import type { ReactElement } from 'react'
import { CardAction } from '../design-system/CardAction'
import { CostList } from '../design-system/CostList'
import { TextField } from '../design-system/TextField'
import type { HireCardContent } from './hireCardOf'

export interface HireCardProps {
  readonly card: HireCardContent
  readonly entry: string
  readonly isWaiting: boolean
  readonly onEntryChange: (entry: string) => void
  readonly onHire: () => void
}

function OpenHire({
  card,
  entry,
  isWaiting,
  onEntryChange,
  onHire,
}: HireCardProps & {
  readonly card: Extract<HireCardContent, { readonly kind: 'open' }>
}): ReactElement {
  return (
    <>
      <TextField
        label={card.fieldLabel}
        name={`hire-${card.hire}`}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={entry}
        isDisabled={card.isFieldDisabled}
        onChange={onEntryChange}
      />
      {card.costs.length > 0 && <CostList costs={card.costs} />}
      <CardAction
        type="button"
        label={card.actionLabel}
        state={card.state}
        isWaiting={isWaiting}
        tone="quiet"
        onAction={onHire}
      />
    </>
  )
}

export function HireCard(props: HireCardProps): ReactElement {
  const { card } = props
  const isLocked = card.kind === 'locked'
  return (
    <div className="flex flex-col gap-2">
      <div>
        <h4 className="m-0 font-sans text-title text-ink">{card.name}</h4>
        <p className="m-0 font-sans text-caption text-ink-muted">{card.teamLine}</p>
      </div>
      <p
        className={`m-0 font-sans text-caption ${isLocked ? 'text-warning-ink' : 'text-ink-muted'}`}
      >
        {card.requirement}
      </p>
      {card.kind === 'open' && <OpenHire {...props} card={card} />}
    </div>
  )
}
