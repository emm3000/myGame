import { Instant, type PlayerId } from '@mygame/domain'
import { eq } from 'drizzle-orm'
import type { ReportClosings } from '../../town/ReportClosings'
import type { PostgresSession } from './connectPostgres'
import { players } from './schema'

export class DrizzleReportClosings implements ReportClosings {
  constructor(private readonly database: PostgresSession) {}

  async close(playerId: PlayerId, now: Instant): Promise<void> {
    await this.database
      .update(players)
      .set({ reportReadAt: new Date(now.epochMilliseconds) })
      .where(eq(players.id, playerId))
  }

  async closedAt(playerId: PlayerId): Promise<Instant | undefined> {
    const [found] = await this.database
      .select({ readAt: players.reportReadAt })
      .from(players)
      .where(eq(players.id, playerId))
    return found === undefined ? undefined : Instant.fromEpochMilliseconds(found.readAt.getTime())
  }
}
