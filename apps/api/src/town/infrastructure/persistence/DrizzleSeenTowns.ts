import type { SeenTowns } from '@mygame/domain'
import { type DomainError, err, type Instant, ok, type PlayerId, type Result } from '@mygame/domain'
import { eq, sql } from 'drizzle-orm'
import type { PostgresSession } from '#platform/infrastructure/persistence/connectPostgres'
import { towns } from './townTables'

export class DrizzleSeenTowns implements SeenTowns {
  constructor(private readonly database: PostgresSession) {}

  async markSeen(playerId: PlayerId, at: Instant): Promise<Result<void, DomainError>> {
    const seen = await this.database
      .update(towns)
      .set({ seenAt: sql`greatest(${towns.seenAt}, ${new Date(at.epochMilliseconds)})` })
      .where(eq(towns.playerId, playerId))
      .returning({ id: towns.id })
    return seen.length === 0 ? err({ kind: 'TownNotFound', playerId }) : ok(undefined)
  }
}
