import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import type { Result } from '#Result'
import type { Instant } from '#time/Instant'

export interface GuidanceDismissals {
  dismiss(playerId: PlayerId, now: Instant): Promise<Result<void, DomainError>>
}
