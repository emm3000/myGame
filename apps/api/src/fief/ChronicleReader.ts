import type { FiefEvent, FiefId } from '@mygame/domain'

export const keptEventsPerFief = 100

export interface ChronicleReader {
  eventsOf(fiefId: FiefId): Promise<ReadonlyArray<FiefEvent>>
}
