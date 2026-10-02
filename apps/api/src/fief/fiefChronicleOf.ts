import type { FiefChronicle } from '@mygame/contracts'
import type { FiefEvent, Instant } from '@mygame/domain'

type WireEvent = FiefChronicle['events'][number]

type WiredEvent = Exclude<FiefEvent, { readonly kind: 'foundingSent' | 'fiefFounded' }>

const isWired = (event: FiefEvent): event is WiredEvent =>
  event.kind !== 'foundingSent' && event.kind !== 'fiefFounded'

const isoOf = (instant: Instant): string => new Date(instant.epochMilliseconds).toISOString()

const wireEventOf = (event: WiredEvent): WireEvent => {
  const occurredAt = isoOf(event.occurredAt)
  switch (event.kind) {
    case 'upgradeFinished':
      return { kind: event.kind, building: event.building, level: event.level, occurredAt }
    case 'artLearned':
      return { kind: event.kind, art: event.art, level: event.level, occurredAt }
    case 'upgradeCancelled':
      return {
        kind: event.kind,
        building: event.building,
        level: event.level,
        occurredAt,
        refund: event.refund,
      }
    case 'studyCancelled':
      return {
        kind: event.kind,
        art: event.art,
        level: event.level,
        occurredAt,
        refund: event.refund,
      }
    case 'recruitsDelivered':
      return { kind: event.kind, unit: event.unit, count: event.count, occurredAt }
    case 'recruitsCancelled':
      return {
        kind: event.kind,
        unit: event.unit,
        delivered: event.delivered,
        cancelled: event.cancelled,
        occurredAt,
        refund: event.refund,
      }
    case 'marchReturned':
      return {
        kind: event.kind,
        province: event.province,
        plot: event.plot,
        units: { ...event.units },
        loot: event.loot,
        occurredAt,
        recalled: event.recalled,
      }
    case 'battleFought':
      return {
        kind: event.kind,
        province: event.province,
        plot: event.plot,
        tier: event.tier,
        won: event.won,
        unitsLost: { ...event.unitsLost },
        campLost: event.campLost,
        occurredAt,
      }
    default: {
      const unreachable: never = event
      return unreachable
    }
  }
}

export const fiefChronicleOf = (events: ReadonlyArray<FiefEvent>): FiefChronicle => ({
  events: events.filter(isWired).map(wireEventOf),
})
