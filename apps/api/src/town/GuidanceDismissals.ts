import type { DomainError, Instant, PlayerId, Result } from '@mygame/domain'

export interface GuidanceDismissals {
  dismiss(playerId: PlayerId, now: Instant): Promise<Result<void, DomainError>>
}
