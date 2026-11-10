import type { Instant, TownEvent, TownId } from '@mygame/domain'

export const keptEventsPerTown = 100

export interface TownNewsReader {
  newsOf(townId: TownId): Promise<ReadonlyArray<TownEvent>>
  newsAfter(townId: TownId, after: Instant): Promise<ReadonlyArray<TownEvent>>
}
