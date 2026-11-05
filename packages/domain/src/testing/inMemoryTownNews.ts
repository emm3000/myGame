import { ok } from '../Result'
import type { TownEvent } from '../town/TownEvent'
import type { TownId } from '../town/TownId'
import type { TownNews } from '../town/TownNews'

export type InMemoryTownNews = TownNews & {
  recordedEventsOf(townId: TownId): ReadonlyArray<TownEvent>
}

export const inMemoryTownNews = (): InMemoryTownNews => {
  const recorded = new Map<TownId, ReadonlyArray<TownEvent>>()
  return {
    recordedEventsOf: (townId) => recorded.get(townId) ?? [],
    record: async (townId, events) => {
      recorded.set(townId, [...(recorded.get(townId) ?? []), ...events])
      return ok(undefined)
    },
  }
}
