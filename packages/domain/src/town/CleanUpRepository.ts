import type { DomainError } from '../DomainError'
import type { Result } from '../Result'
import type { Instant } from '../time/Instant'
import type { CleanUp } from './CleanUp'
import type { SiteAddress } from './SiteAddress'
import type { TownId } from './TownId'

export interface CleanUpRepository {
  lastCleanedAt(site: SiteAddress, at: Instant): Promise<Instant | undefined>
  record(cleanUp: CleanUp): Promise<Result<void, DomainError>>
  cancel(townId: TownId, sentAt: Instant): Promise<Result<void, DomainError>>
}
