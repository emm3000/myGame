import type { FiefEvent, ResourceAmounts } from '@mygame/contracts'
import { copy, type ResourceQuantity } from '../copy'
import type { CardCost } from '../design-system/CostList'
import { quantitiesOf } from '../resources/quantitiesOf'
import { formatInstant } from './formatInstant'

export interface ChronicleAmounts {
  readonly label: string
  readonly sentence: string
  readonly costs: ReadonlyArray<CardCost>
}

export interface ChronicleRow {
  readonly key: string
  readonly occurredAt: string
  readonly instant: string
  readonly heading: string
  readonly subject: string
  readonly amounts: ChronicleAmounts | undefined
}

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
    case 'recruitsCancelled':
      return {
        identity: `${event.unit}-${event.delivered}-${event.cancelled}`,
        text: copy.chronicle.recruitsCancelled(event.unit, event.delivered, event.cancelled),
      }
    case 'marchReturned':
      return {
        identity: `${event.province}-${event.plot}-${event.infantry}`,
        text: copy.chronicle.march(event.province, event.plot, event.infantry),
      }
    default: {
      const unreachable: never = event
      return unreachable
    }
  }
}

const listedAmounts = (
  amounts: ResourceAmounts,
  label: string,
  sentenceOf: (listed: ReadonlyArray<ResourceQuantity>) => string,
): ChronicleAmounts | undefined => {
  const listed = quantitiesOf(amounts)
  if (listed.length === 0) {
    return undefined
  }
  return {
    label,
    sentence: sentenceOf(listed),
    costs: listed.map(({ resource, amount }) => ({ kind: resource, amount, isShort: false })),
  }
}

const amountsOf = (event: FiefEvent): ChronicleAmounts | undefined => {
  if ('refund' in event) {
    return listedAmounts(event.refund, copy.chronicle.recovered, copy.chronicle.refunded)
  }
  if ('loot' in event) {
    return listedAmounts(event.loot, copy.chronicle.received, copy.chronicle.looted)
  }
  return undefined
}

export function chronicleRowOf(event: FiefEvent, readAt: Date): ChronicleRow {
  const subject = subjectOf(event)
  return {
    key: `${event.kind}-${subject.identity}-${event.occurredAt}`,
    occurredAt: event.occurredAt,
    instant: formatInstant(new Date(event.occurredAt), readAt),
    heading: copy.chronicle.headings[event.kind],
    subject: subject.text,
    amounts: amountsOf(event),
  }
}
