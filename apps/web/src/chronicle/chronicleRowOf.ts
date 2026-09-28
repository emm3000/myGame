import { type FiefEvent, ResourceKindSchema } from '@mygame/contracts'
import { copy } from '../copy'
import type { CardCost } from '../design-system/CostList'
import { formatInstant } from './formatInstant'

export interface ChronicleRefund {
  readonly sentence: string
  readonly costs: ReadonlyArray<CardCost>
}

export interface ChronicleRow {
  readonly key: string
  readonly occurredAt: string
  readonly instant: string
  readonly heading: string
  readonly subject: string
  readonly refund: ChronicleRefund | undefined
}

type Refund = Extract<FiefEvent, { readonly refund: unknown }>['refund']

const labelOf = (event: FiefEvent): string =>
  'building' in event ? copy.names.buildings[event.building] : copy.names.arts[event.art]

const refundOf = (refund: Refund): ChronicleRefund => {
  const refunded = ResourceKindSchema.options
    .filter((resource) => refund[resource] > 0)
    .map((resource) => ({ resource, amount: refund[resource] }))
  return {
    sentence: copy.chronicle.refunded(refunded),
    costs: refunded.map(({ resource, amount }) => ({ kind: resource, amount, isShort: false })),
  }
}

export function chronicleRowOf(event: FiefEvent, readAt: Date): ChronicleRow {
  const label = labelOf(event)
  return {
    key: `${event.kind}-${label}-${event.level}-${event.occurredAt}`,
    occurredAt: event.occurredAt,
    instant: formatInstant(new Date(event.occurredAt), readAt),
    heading: copy.chronicle.headings[event.kind],
    subject: copy.chronicle.subject(label, event.level),
    refund: 'refund' in event ? refundOf(event.refund) : undefined,
  }
}
