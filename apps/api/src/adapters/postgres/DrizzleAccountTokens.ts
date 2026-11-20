import type { Instant, PlayerId } from '@mygame/domain'
import { and, eq, gt, isNotNull, isNull, lte, or, sql } from 'drizzle-orm'
import type { AccountToken, AccountTokenKind, AccountTokens } from '../../auth/AccountTokens'
import { isRedeemableAgain } from '../../auth/isRedeemableAgain'
import { tokenDigest } from '../../auth/tokenDigest'
import type { PostgresSession } from './connectPostgres'
import { accountTokens, players } from './schema'

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
        tokenDigest: tokenDigest(token.token),
        playerId: token.playerId,
        kind: token.kind,
        expiresAt: dateOf(token.expiresAt),
      })
    })
  }

  async redeem(token: string, kind: AccountTokenKind, now: Instant): Promise<PlayerId | undefined> {
    const redeemable = and(
      eq(accountTokens.tokenDigest, tokenDigest(token)),
      eq(accountTokens.kind, kind),
      gt(accountTokens.expiresAt, dateOf(now)),
      isRedeemableAgain(kind) ? undefined : isNull(accountTokens.usedAt),
    )
    return this.database.transaction(async (transaction) => {
      const [holder] = await transaction
        .select({ playerId: accountTokens.playerId })
        .from(accountTokens)
        .where(redeemable)
      if (holder === undefined) {
        return undefined
      }
      await transaction
        .select({ id: players.id })
        .from(players)
        .where(eq(players.id, holder.playerId))
        .for('no key update')
      const [redeemed] = await transaction
        .update(accountTokens)
        .set({ usedAt: sql`coalesce(${accountTokens.usedAt}, ${dateOf(now)})` })
        .where(redeemable)
        .returning({ playerId: accountTokens.playerId })
      return redeemed?.playerId
    })
  }
}
