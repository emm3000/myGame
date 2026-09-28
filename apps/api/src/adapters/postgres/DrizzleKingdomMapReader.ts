import type { KingdomMapReader, PlayerId, PlotAddress, PlotHolder } from '@mygame/domain'
import { and, asc, eq, max } from 'drizzle-orm'
import type { PostgresSession } from './connectPostgres'
import { fiefs } from './schema'

export class DrizzleKingdomMapReader implements KingdomMapReader {
  constructor(private readonly database: PostgresSession) {}

  async addressOf(playerId: PlayerId): Promise<PlotAddress | undefined> {
    const [address] = await this.database
      .select({ kingdom: fiefs.kingdom, province: fiefs.province, plot: fiefs.plot })
      .from(fiefs)
      .where(eq(fiefs.playerId, playerId))
    return address
  }

  async lastOccupiedProvince(kingdom: number): Promise<number> {
    const [highest] = await this.database
      .select({ province: max(fiefs.province) })
      .from(fiefs)
      .where(eq(fiefs.kingdom, kingdom))
    return highest?.province ?? 0
  }

  async holdersIn(kingdom: number, province: number): Promise<ReadonlyArray<PlotHolder>> {
    return this.database
      .select({ plot: fiefs.plot, name: fiefs.name, playerId: fiefs.playerId })
      .from(fiefs)
      .where(and(eq(fiefs.kingdom, kingdom), eq(fiefs.province, province)))
      .orderBy(asc(fiefs.plot))
  }
}
