import type { Instant } from '../../time/Instant'
import type { TownId } from '../TownId'
import type { SiteAddress } from './SiteAddress'

export type CleanUp = {
  readonly townId: TownId
  readonly sentAt: Instant
  readonly site: SiteAddress
  readonly cleanedAt: Instant
}
