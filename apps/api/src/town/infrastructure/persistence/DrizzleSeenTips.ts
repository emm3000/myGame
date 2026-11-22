import type { PlayerId, SeenTips, TipKind } from '@mygame/domain'
import type { PostgresSession } from '#platform/infrastructure/persistence/connectPostgres'
import { storedTips } from './aggregatedSeenTips'
import { playerSeenTips } from './guidanceTables'

export class DrizzleSeenTips implements SeenTips {
  constructor(private readonly database: PostgresSession) {}

  async markSeen(playerId: PlayerId, tip: TipKind): Promise<void> {
    await this.database
      .insert(playerSeenTips)
      .values({ playerId, tip: storedTips[tip] })
      .onConflictDoNothing()
  }
}
