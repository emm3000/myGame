import type { PlayerId, TipKind } from '@mygame/domain'
import type { SeenTips } from '../../town/SeenTips'
import { storedTips } from './aggregatedSeenTips'
import type { PostgresSession } from './connectPostgres'
import { playerSeenTips } from './schema'

export class DrizzleSeenTips implements SeenTips {
  constructor(private readonly database: PostgresSession) {}

  async markSeen(playerId: PlayerId, tip: TipKind): Promise<void> {
    await this.database
      .insert(playerSeenTips)
      .values({ playerId, tip: storedTips[tip] })
      .onConflictDoNothing()
  }
}
