import type { FiefId, HeldAddress, KingdomMapReader, PlotHolder } from '@mygame/domain'
import { and, asc, eq, max } from 'drizzle-orm'
import type { PostgresSession } from './connectPostgres'
import { fiefs } from './schema'

export class DrizzleKingdomMapReader implements KingdomMapReader {
  constructor(private readonly database: PostgresSession) {}

  async addressOf(fiefId: FiefId): Promise<HeldAddress | undefined> {
    const [held] = await this.database
      .select({
        kingdom: fiefs.kingdom,
        province: fiefs.province,
        plot: fiefs.plot,
        playerId: fiefs.playerId,
      })
      .from(fiefs)
      .where(eq(fiefs.id, fiefId))
    if (held === undefined) {
      return undefined
    }
    const { kingdom, province, plot, playerId } = held
    return { address: { kingdom, province, plot }, playerId }
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
