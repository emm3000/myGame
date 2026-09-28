import type { FiefEvent } from '../fief/FiefEvent'
import type { FiefId } from '../fief/FiefId'
import type { ChronicleWriter } from '../ports/ChronicleWriter'
import { ok } from '../Result'

export type InMemoryChronicle = ChronicleWriter & {
  recordedEventsOf(fiefId: FiefId): ReadonlyArray<FiefEvent>
}

export const inMemoryChronicle = (): InMemoryChronicle => {
  const recorded = new Map<FiefId, ReadonlyArray<FiefEvent>>()
  return {
    recordedEventsOf: (fiefId) => recorded.get(fiefId) ?? [],
    record: async (fiefId, events) => {
      recorded.set(fiefId, [...(recorded.get(fiefId) ?? []), ...events])
      return ok(undefined)
    },
  }
}
