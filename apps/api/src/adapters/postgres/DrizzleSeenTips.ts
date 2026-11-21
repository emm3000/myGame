import type { PlayerId, TipKind } from '@mygame/domain'
import type { PostgresSession } from '../../platform/infrastructure/postgres/connectPostgres'
import { playerSeenTips } from '../../town/infrastructure/postgres/townTables'
import type { SeenTips } from '../../town/SeenTips'
import { storedTips } from './aggregatedSeenTips'

export class DrizzleSeenTips implements SeenTips {
  constructor(private readonly database: PostgresSession) {}

  async markSeen(playerId: PlayerId, tip: TipKind): Promise<void> {
    await this.database
      .insert(playerSeenTips)
      .values({ playerId, tip: storedTips[tip] })
      .onConflictDoNothing()
  }
}
