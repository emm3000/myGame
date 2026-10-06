import type { FiefId, FiefOfPlayer, Instant } from '@mygame/domain'
import { and, eq, isNotNull } from 'drizzle-orm'
import type { GuidanceDismissal, GuidanceDismissals } from '../../guidance/GuidanceDismissals'
import type { PostgresSession } from './connectPostgres'
import { fiefs } from './schema'

export class DrizzleGuidanceDismissals implements GuidanceDismissals {
  constructor(private readonly database: PostgresSession) {}

  async dismiss({ playerId, fiefId }: FiefOfPlayer, now: Instant): Promise<GuidanceDismissal> {
    const dismissed = await this.database
      .update(fiefs)
      .set({ guidanceDismissedAt: new Date(now.epochMilliseconds) })
      .where(and(eq(fiefs.id, fiefId), eq(fiefs.playerId, playerId)))
      .returning({ id: fiefs.id })
    return dismissed.length === 0 ? 'fiefNotFound' : 'dismissed'
  }

  async isDismissed(fiefId: FiefId): Promise<boolean> {
    const dismissed = await this.database
      .select({ id: fiefs.id })
      .from(fiefs)
      .where(and(eq(fiefs.id, fiefId), isNotNull(fiefs.guidanceDismissedAt)))
    return dismissed.length > 0
  }
}
