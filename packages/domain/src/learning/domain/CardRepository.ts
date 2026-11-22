import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import type { Result } from '#Result'
import type { HeldCard } from './HeldCard'

export interface CardRepository {
  cardsOf(playerId: PlayerId): Promise<Result<ReadonlyArray<HeldCard>, DomainError>>
  save(playerId: PlayerId, held: HeldCard): Promise<Result<void, DomainError>>
}
