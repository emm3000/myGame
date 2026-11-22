import type { DomainError } from '#DomainError'
import type { Band } from '#learning/curriculum/domain/Band'
import type { PlayerId } from '#player/PlayerId'
import type { Result } from '#Result'
import type { BandStart } from './BandStart'
import type { HoldoutCheck } from './HoldoutCheck'

export interface BandStartRepository {
  bandStartsOf(playerId: PlayerId): Promise<Result<ReadonlyArray<BandStart>, DomainError>>
  save(playerId: PlayerId, start: BandStart): Promise<Result<void, DomainError>>
  saveCheck(playerId: PlayerId, band: Band, check: HoldoutCheck): Promise<Result<void, DomainError>>
}
