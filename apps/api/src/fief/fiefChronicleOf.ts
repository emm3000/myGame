import type { FiefChronicle } from '@mygame/contracts'
import type { FiefEvent, Instant } from '@mygame/domain'

type WireEvent = FiefChronicle['events'][number]

const isoOf = (instant: Instant): string => new Date(instant.epochMilliseconds).toISOString()

const wireEventOf = (event: FiefEvent): WireEvent => {
  switch (event.kind) {
    case 'upgradeFinished':
    case 'artLearned':
      return { ...event, occurredAt: isoOf(event.occurredAt) }
    case 'upgradeCancelled':
    case 'studyCancelled':
      return { ...event, occurredAt: isoOf(event.occurredAt), refund: { ...event.refund } }
    default: {
      const unreachable: never = event
      return unreachable
    }
  }
}

export const fiefChronicleOf = (events: ReadonlyArray<FiefEvent>): FiefChronicle => ({
  events: events.map(wireEventOf),
})
