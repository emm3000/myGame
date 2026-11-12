import { type DomainError, err, type Instant, ok, type PlayerId, type Result } from '@mygame/domain'
import { eq, sql } from 'drizzle-orm'
import type { GuidanceDismissals } from '../../town/GuidanceDismissals'
import type { PostgresSession } from './connectPostgres'
import { towns } from './schema'

export class DrizzleGuidanceDismissals implements GuidanceDismissals {
  constructor(private readonly database: PostgresSession) {}

  async dismiss(playerId: PlayerId, now: Instant): Promise<Result<void, DomainError>> {
    const dismissed = await this.database
      .update(towns)
      .set({
        guidanceDismissedAt: sql`coalesce(${towns.guidanceDismissedAt}, ${new Date(now.epochMilliseconds)})`,
      })
      .where(eq(towns.playerId, playerId))
      .returning({ id: towns.id })
    return dismissed.length === 0 ? err({ kind: 'TownNotFound', playerId }) : ok(undefined)
  }
}
