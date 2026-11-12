import type { Instant } from '../time/Instant'

export interface CleanUpReader {
  lastCleanedAtIn(region: number, area: number, at: Instant): Promise<ReadonlyMap<number, Instant>>
}
