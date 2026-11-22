import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import type { Result } from '#Result'
import type { Placement } from './Placement'

export interface PlacementRepository {
  placementOf(playerId: PlayerId): Promise<Result<Placement | undefined, DomainError>>
  save(playerId: PlayerId, placement: Placement): Promise<Result<void, DomainError>>
}
