import type { Instant } from '#time/Instant'
import type { TownEvent } from './TownEvent'
import type { TownId } from './TownId'

export const keptEventsPerTown = 100

export interface TownNewsReader {
  newsOf(townId: TownId): Promise<ReadonlyArray<TownEvent>>
  newsAfter(townId: TownId, after: Instant): Promise<ReadonlyArray<TownEvent>>
}
