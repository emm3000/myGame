import {
  type CampBattle,
  type CampRegistry,
  type DomainError,
  Instant,
  ok,
  type PlotAddress,
  type Result,
} from '@mygame/domain'
import { and, asc, desc, eq } from 'drizzle-orm'
import type { PostgresSession } from './connectPostgres'
import { campBattles } from './schema'

type BattleRow = Omit<typeof campBattles.$inferSelect, 'id'>

const battleColumns = {
  kingdom: campBattles.kingdom,
  province: campBattles.province,
  plot: campBattles.plot,
  strength: campBattles.strength,
  foughtAt: campBattles.foughtAt,
}

const battleOf = (row: BattleRow): CampBattle => ({
  kingdom: row.kingdom,
  province: row.province,
  plot: row.plot,
  strength: row.strength,
  foughtAt: Instant.fromEpochMilliseconds(row.foughtAt.getTime()),
})

export class DrizzleCampRegistry implements CampRegistry {
  constructor(private readonly database: PostgresSession) {}

  async lastBattleOf(address: PlotAddress): Promise<CampBattle | undefined> {
    const [last] = await this.database
      .select(battleColumns)
      .from(campBattles)
      .where(
        and(
          eq(campBattles.kingdom, address.kingdom),
          eq(campBattles.province, address.province),
          eq(campBattles.plot, address.plot),
        ),
      )
      .orderBy(desc(campBattles.foughtAt), desc(campBattles.id))
      .limit(1)
    return last === undefined ? undefined : battleOf(last)
  }

  async lastBattlesIn(kingdom: number, province: number): Promise<ReadonlyArray<CampBattle>> {
    const lastBattles = await this.database
      .selectDistinctOn([campBattles.plot], battleColumns)
      .from(campBattles)
      .where(and(eq(campBattles.kingdom, kingdom), eq(campBattles.province, province)))
      .orderBy(asc(campBattles.plot), desc(campBattles.foughtAt), desc(campBattles.id))
    return lastBattles.map(battleOf)
  }

  async record(battle: CampBattle): Promise<Result<void, DomainError>> {
    await this.database.insert(campBattles).values({
      kingdom: battle.kingdom,
      province: battle.province,
      plot: battle.plot,
      strength: battle.strength,
      foughtAt: new Date(battle.foughtAt.epochMilliseconds),
    })
    return ok(undefined)
  }
}
