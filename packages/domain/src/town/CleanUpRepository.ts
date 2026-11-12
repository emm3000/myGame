import type { DomainError } from '../DomainError'
import type { Result } from '../Result'
import type { Instant } from '../time/Instant'
import type { CleanUp } from './CleanUp'
import type { CleanUpReader } from './CleanUpReader'
import type { TownId } from './TownId'

export interface CleanUpRepository extends CleanUpReader {
  record(cleanUp: CleanUp): Promise<Result<void, DomainError>>
  cancel(townId: TownId, sentAt: Instant): Promise<Result<void, DomainError>>
}
