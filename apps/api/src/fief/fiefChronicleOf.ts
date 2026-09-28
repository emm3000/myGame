import type { FiefChronicle } from '@mygame/contracts'
import type { FiefEvent, Instant } from '@mygame/domain'

type WireEvent = FiefChronicle['events'][number]

const isoOf = (instant: Instant): string => new Date(instant.epochMilliseconds).toISOString()

const wireEventOf = (event: FiefEvent): WireEvent => {
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
    default: {
      const unreachable: never = event
      return unreachable
    }
  }
}

export const fiefChronicleOf = (events: ReadonlyArray<FiefEvent>): FiefChronicle => ({
  events: events.map(wireEventOf),
})
