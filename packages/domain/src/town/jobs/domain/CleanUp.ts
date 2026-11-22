import type { Instant } from '#time/Instant'
import type { SiteAddress } from '../../domain/SiteAddress'
import type { TownId } from '../../domain/TownId'

export type CleanUp = {
  readonly townId: TownId
  readonly sentAt: Instant
  readonly site: SiteAddress
  readonly cleanedAt: Instant
}
