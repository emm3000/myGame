import { type HintKind, HintKindSchema } from '@mygame/contracts'
import type { PlayerId } from '@mygame/domain'
import { eq } from 'drizzle-orm'
import type { SeenHints } from '../../hint/SeenHints'
import type { PostgresSession } from './connectPostgres'
import { playerSeenHints } from './schema'

export class DrizzleSeenHints implements SeenHints {
  constructor(private readonly database: PostgresSession) {}

  async markSeen(playerId: PlayerId, hint: HintKind): Promise<void> {
    await this.database.insert(playerSeenHints).values({ playerId, hint }).onConflictDoNothing()
  }

  async seenHintsOf(playerId: PlayerId): Promise<ReadonlyArray<HintKind>> {
    const rows = await this.database
      .select({ hint: playerSeenHints.hint })
      .from(playerSeenHints)
      .where(eq(playerSeenHints.playerId, playerId))
    const seen = new Set(rows.map((row) => row.hint))
    return HintKindSchema.options.filter((hint) => seen.has(hint))
  }
}
