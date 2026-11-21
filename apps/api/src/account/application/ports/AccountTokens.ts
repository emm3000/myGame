import type { Instant, PlayerId } from '@mygame/domain'

export type AccountTokenKind = 'reset' | 'verify'

export type AccountToken = {
  readonly token: string
  readonly playerId: PlayerId
  readonly kind: AccountTokenKind
  readonly expiresAt: Instant
}

export interface AccountTokens {
  issue(token: AccountToken, now: Instant): Promise<void>
  redeem(token: string, kind: AccountTokenKind, now: Instant): Promise<PlayerId | undefined>
}
