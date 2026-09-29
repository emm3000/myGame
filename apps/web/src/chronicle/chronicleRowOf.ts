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

interface ChronicleSubject {
  readonly identity: string
  readonly text: string
}

const subjectOf = (event: FiefEvent): ChronicleSubject => {
  switch (event.kind) {
    case 'upgradeFinished':
    case 'upgradeCancelled':
      return {
        identity: `${event.building}-${event.level}`,
        text: copy.chronicle.subject(copy.names.buildings[event.building], event.level),
      }
    case 'artLearned':
    case 'studyCancelled':
      return {
        identity: `${event.art}-${event.level}`,
        text: copy.chronicle.subject(copy.names.arts[event.art], event.level),
      }
    case 'recruitsDelivered':
      return {
        identity: `${event.unit}-${event.count}`,
        text: copy.chronicle.recruits(event.unit, event.count),
      }
    default: {
      const unreachable: never = event
      return unreachable
    }
  }
}

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
  const subject = subjectOf(event)
  return {
    key: `${event.kind}-${subject.identity}-${event.occurredAt}`,
    occurredAt: event.occurredAt,
    instant: formatInstant(new Date(event.occurredAt), readAt),
    heading: copy.chronicle.headings[event.kind],
    subject: subject.text,
    refund: 'refund' in event ? refundOf(event.refund) : undefined,
  }
}
