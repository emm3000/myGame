import type { FiefId } from '@mygame/domain'
import type { ChronicledEvent } from './chronicledEventsOf'

export const keptEventsPerFief = 100

export interface ChronicleReader {
  eventsOf(fiefId: FiefId): Promise<ReadonlyArray<ChronicledEvent>>
}
