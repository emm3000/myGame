import type { PlayerId, RegionMapReader, SiteAddress, SiteHolder } from '@mygame/domain'
import { and, asc, eq, max } from 'drizzle-orm'
import type { PostgresSession } from './connectPostgres'
import { towns } from './schema'

export class DrizzleRegionMap implements RegionMapReader {
  constructor(private readonly database: PostgresSession) {}

  async addressOf(playerId: PlayerId): Promise<SiteAddress | undefined> {
    const [held] = await this.database
      .select({ region: towns.region, area: towns.area, site: towns.site })
      .from(towns)
      .where(eq(towns.playerId, playerId))
    return held
  }

  async lastAreaHoldingTown(region: number): Promise<number> {
    const [last] = await this.database
      .select({ area: max(towns.area) })
      .from(towns)
      .where(eq(towns.region, region))
    return last?.area ?? 0
  }

  async townsIn(region: number, area: number): Promise<ReadonlyArray<SiteHolder>> {
    return this.database
      .select({ site: towns.site, name: towns.name, playerId: towns.playerId })
      .from(towns)
      .where(and(eq(towns.region, region), eq(towns.area, area)))
      .orderBy(asc(towns.site))
  }
}
