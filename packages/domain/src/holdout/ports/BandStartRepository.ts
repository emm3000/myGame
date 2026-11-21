import type { DomainError } from '../../DomainError'
import type { Band, BandStart } from '../../learning/curriculum/BandStart'
import type { PlayerId } from '../../player/PlayerId'
import type { Result } from '../../Result'
import type { HoldoutCheck } from '../HoldoutCheck'

export interface BandStartRepository {
  bandStartsOf(playerId: PlayerId): Promise<Result<ReadonlyArray<BandStart>, DomainError>>
  save(playerId: PlayerId, start: BandStart): Promise<Result<void, DomainError>>
  saveCheck(playerId: PlayerId, band: Band, check: HoldoutCheck): Promise<Result<void, DomainError>>
}
