import type { Instant } from '@mygame/domain'
import type { TownEvent, TownId } from '@mygame/domain/town'

export const keptEventsPerTown = 100

export interface TownNewsReader {
  newsOf(townId: TownId): Promise<ReadonlyArray<TownEvent>>
  newsAfter(townId: TownId, after: Instant): Promise<ReadonlyArray<TownEvent>>
}
