import type { DomainError } from '../DomainError'
import type { HoldoutCheck } from '../holdout/HoldoutCheck'
import type { Band, BandStart } from '../learning/BandStart'
import type { PlayerId } from '../player/PlayerId'
import type { Result } from '../Result'

export interface BandStartRepository {
  bandStartsOf(playerId: PlayerId): Promise<Result<ReadonlyArray<BandStart>, DomainError>>
  save(playerId: PlayerId, start: BandStart): Promise<Result<void, DomainError>>
  saveCheck(playerId: PlayerId, band: Band, check: HoldoutCheck): Promise<Result<void, DomainError>>
}
