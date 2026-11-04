import type { DomainError } from '../DomainError'
import type { HeldCard } from '../learning/HeldCard'
import type { PlayerId } from '../player/PlayerId'
import type { Result } from '../Result'

export interface CardRepository {
  cardsOf(playerId: PlayerId): Promise<Result<ReadonlyArray<HeldCard>, DomainError>>
  save(playerId: PlayerId, held: HeldCard): Promise<Result<void, DomainError>>
}
