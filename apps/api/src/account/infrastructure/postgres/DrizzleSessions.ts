import type { Instant, PlayerId } from '@mygame/domain'
import { and, eq, gt } from 'drizzle-orm'
import type { PostgresSession } from '../../../platform/infrastructure/postgres/connectPostgres'
import type { Session, Sessions } from '../../application/ports/Sessions'
import { tokenDigest } from '../../application/tokenDigest'
import { sessions } from './accountTables'

const dateOf = (instant: Instant): Date => new Date(instant.epochMilliseconds)

export class DrizzleSessions implements Sessions {
  constructor(private readonly database: PostgresSession) {}

  async openSession(session: Session): Promise<void> {
    await this.database.insert(sessions).values({
      tokenDigest: tokenDigest(session.token),
      playerId: session.playerId,
      expiresAt: dateOf(session.expiresAt),
    })
  }

  async renewSession(
    token: string,
    now: Instant,
    expiresAt: Instant,
  ): Promise<PlayerId | undefined> {
    const [renewed] = await this.database
      .update(sessions)
      .set({ expiresAt: dateOf(expiresAt) })
      .where(and(eq(sessions.tokenDigest, tokenDigest(token)), gt(sessions.expiresAt, dateOf(now))))
      .returning({ playerId: sessions.playerId })
    return renewed?.playerId
  }

  async closeSession(token: string): Promise<void> {
    await this.database.delete(sessions).where(eq(sessions.tokenDigest, tokenDigest(token)))
  }

  async closeSessionsOf(playerId: PlayerId): Promise<void> {
    await this.database.delete(sessions).where(eq(sessions.playerId, playerId))
  }
}
