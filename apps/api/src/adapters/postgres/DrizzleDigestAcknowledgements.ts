import { Instant, type PlayerId } from '@mygame/domain'
import { eq } from 'drizzle-orm'
import type { DigestAcknowledgements } from '../../digest/DigestAcknowledgements'
import type { PostgresSession } from './connectPostgres'
import { players } from './schema'

export class DrizzleDigestAcknowledgements implements DigestAcknowledgements {
  constructor(private readonly database: PostgresSession) {}

  async acknowledge(playerId: PlayerId, now: Instant): Promise<void> {
    await this.database
      .update(players)
      .set({ digestAcknowledgedAt: new Date(now.epochMilliseconds) })
      .where(eq(players.id, playerId))
  }

  async acknowledgedAt(playerId: PlayerId): Promise<Instant | undefined> {
    const [found] = await this.database
      .select({ acknowledgedAt: players.digestAcknowledgedAt })
      .from(players)
      .where(eq(players.id, playerId))
    return found === undefined
      ? undefined
      : Instant.fromEpochMilliseconds(found.acknowledgedAt.getTime())
  }
}
