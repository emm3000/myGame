import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import type { Result } from '#Result'
import type { Instant } from '#time/Instant'

export interface SeenTowns {
  markSeen(playerId: PlayerId, at: Instant): Promise<Result<void, DomainError>>
}
