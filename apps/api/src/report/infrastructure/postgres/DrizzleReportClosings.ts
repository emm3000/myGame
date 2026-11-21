import { Instant, type PlayerId } from '@mygame/domain'
import { eq, sql } from 'drizzle-orm'
import { players } from '#account/infrastructure/postgres/accountTables'
import type { PostgresSession } from '#platform/infrastructure/postgres/connectPostgres'
import type { ReportClosings } from '../../application/ports/ReportClosings'

export class DrizzleReportClosings implements ReportClosings {
  constructor(private readonly database: PostgresSession) {}

  async serve(playerId: PlayerId, at: Instant): Promise<void> {
    await this.database
      .update(players)
      .set({
        reportServedAt: sql`greatest(${players.reportServedAt}, ${new Date(at.epochMilliseconds)})`,
      })
      .where(eq(players.id, playerId))
  }

  async close(playerId: PlayerId): Promise<void> {
    await this.database
      .update(players)
      .set({ reportReadAt: sql`greatest(${players.reportReadAt}, ${players.reportServedAt})` })
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
