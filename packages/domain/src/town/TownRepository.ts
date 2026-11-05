import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type { Result } from '../Result'
import type { SiteAddress } from './SiteAddress'
import type { Town } from './Town'

export interface TownRepository {
  holdsTown(playerId: PlayerId): Promise<boolean>
  occupiedSites(): Promise<ReadonlyArray<SiteAddress>>
  townOf(playerId: PlayerId): Promise<Result<Town | undefined, DomainError>>
  save(town: Town): Promise<Result<void, DomainError>>
}
