import type { Instant } from '../time/Instant'
import type { SiteAddress } from './SiteAddress'

export interface CleanUpReader {
  lastCleanedAt(site: SiteAddress, at: Instant): Promise<Instant | undefined>
  lastCleanedAtIn(region: number, area: number, at: Instant): Promise<ReadonlyMap<number, Instant>>
}
