import type { Instant, PlayerId } from '@mygame/domain'
import type { AccountToken, AccountTokenKind, AccountTokens } from '../../auth/AccountTokens'
import { sessionTokenDigest } from '../postgres/sessionTokenDigest'

type StoredToken = {
  readonly playerId: PlayerId
  readonly kind: AccountTokenKind
  readonly expiresAt: Instant
  readonly usedAt: Instant | undefined
}

const isLive = (stored: StoredToken, now: Instant): boolean =>
  stored.usedAt === undefined && stored.expiresAt.epochMilliseconds > now.epochMilliseconds

export class MemoryAccountTokens implements AccountTokens {
  private readonly tokens = new Map<string, StoredToken>()

  async issue(token: AccountToken, now: Instant): Promise<void> {
    for (const [digest, stored] of this.tokens) {
      if (
        stored.playerId === token.playerId &&
        (stored.kind === token.kind || !isLive(stored, now))
      ) {
        this.tokens.delete(digest)
      }
    }
    this.tokens.set(sessionTokenDigest(token.token), {
      playerId: token.playerId,
      kind: token.kind,
      expiresAt: token.expiresAt,
      usedAt: undefined,
    })
  }

  async redeem(token: string, kind: AccountTokenKind, now: Instant): Promise<PlayerId | undefined> {
    const digest = sessionTokenDigest(token)
    const stored = this.tokens.get(digest)
    if (stored === undefined || stored.kind !== kind || !isLive(stored, now)) {
      return undefined
    }
    this.tokens.set(digest, { ...stored, usedAt: now })
    return stored.playerId
  }
}
