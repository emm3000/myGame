import type { Instant } from '../time/Instant'
import type { SiteAddress } from './SiteAddress'
import type { TownId } from './TownId'

export type CleanUp = {
  readonly townId: TownId
  readonly sentAt: Instant
  readonly site: SiteAddress
  readonly cleanedAt: Instant
}
