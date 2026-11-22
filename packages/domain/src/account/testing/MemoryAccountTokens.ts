import type { PlayerId } from '#player/PlayerId'
import type { Instant } from '#time/Instant'
import type { AccountToken, AccountTokenKind, AccountTokens } from '../domain/AccountTokens'
import { isRedeemableAgain } from '../domain/isRedeemableAgain'

type StoredToken = {
  readonly playerId: PlayerId
  readonly kind: AccountTokenKind
  readonly expiresAt: Instant
  readonly usedAt: Instant | undefined
}

const isLive = (stored: StoredToken, now: Instant): boolean =>
  stored.usedAt === undefined && stored.expiresAt.epochMilliseconds > now.epochMilliseconds

const isRedeemable = (stored: StoredToken, kind: AccountTokenKind, now: Instant): boolean =>
  stored.kind === kind &&
  stored.expiresAt.epochMilliseconds > now.epochMilliseconds &&
  (stored.usedAt === undefined || isRedeemableAgain(kind))

export class MemoryAccountTokens implements AccountTokens {
  private readonly tokens = new Map<string, StoredToken>()

  async issue(token: AccountToken, now: Instant): Promise<void> {
    for (const [issued, stored] of this.tokens) {
      if (
        stored.playerId === token.playerId &&
        (stored.kind === token.kind || !isLive(stored, now))
      ) {
        this.tokens.delete(issued)
      }
    }
    this.tokens.set(token.token, {
      playerId: token.playerId,
      kind: token.kind,
      expiresAt: token.expiresAt,
      usedAt: undefined,
    })
  }

  async redeem(token: string, kind: AccountTokenKind, now: Instant): Promise<PlayerId | undefined> {
    const stored = this.tokens.get(token)
    if (stored === undefined || !isRedeemable(stored, kind, now)) {
      return undefined
    }
    this.tokens.set(token, { ...stored, usedAt: stored.usedAt ?? now })
    return stored.playerId
  }
}
