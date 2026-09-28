import type { Instant, PlayerId } from '@mygame/domain'
import { and, eq, gt, isNotNull, isNull, lte, or } from 'drizzle-orm'
import type { AccountToken, AccountTokenKind, AccountTokens } from '../../auth/AccountTokens'
import type { PostgresSession } from './connectPostgres'
import { accountTokens, players } from './schema'
import { sessionTokenDigest } from './sessionTokenDigest'

const dateOf = (instant: Instant): Date => new Date(instant.epochMilliseconds)

export class DrizzleAccountTokens implements AccountTokens {
  constructor(private readonly database: PostgresSession) {}

  async issue(token: AccountToken, now: Instant): Promise<void> {
    await this.database.transaction(async (transaction) => {
      await transaction
        .select({ id: players.id })
        .from(players)
        .where(eq(players.id, token.playerId))
        .for('no key update')
      await transaction
        .delete(accountTokens)
        .where(
          and(
            eq(accountTokens.playerId, token.playerId),
            or(
              eq(accountTokens.kind, token.kind),
              isNotNull(accountTokens.usedAt),
              lte(accountTokens.expiresAt, dateOf(now)),
            ),
          ),
        )
      await transaction.insert(accountTokens).values({
        tokenDigest: sessionTokenDigest(token.token),
        playerId: token.playerId,
        kind: token.kind,
        expiresAt: dateOf(token.expiresAt),
      })
    })
  }

  async redeem(token: string, kind: AccountTokenKind, now: Instant): Promise<PlayerId | undefined> {
    const [redeemed] = await this.database
      .update(accountTokens)
      .set({ usedAt: dateOf(now) })
      .where(
        and(
          eq(accountTokens.tokenDigest, sessionTokenDigest(token)),
          eq(accountTokens.kind, kind),
          isNull(accountTokens.usedAt),
          gt(accountTokens.expiresAt, dateOf(now)),
        ),
      )
      .returning({ playerId: accountTokens.playerId })
    return redeemed?.playerId
  }
}
