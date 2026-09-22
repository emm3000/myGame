import {
  type BuildingKind,
  type BuildSlot,
  type DomainError,
  err,
  Fief,
  type FiefBuildingLevels,
  type FiefRepository,
  Instant,
  ok,
  type PlayerId,
  type PlotAddress,
  type Result,
  type StoredFief,
} from '@mygame/domain'
import { eq, sql } from 'drizzle-orm'
import { DatabaseError } from 'pg'
import type { PostgresSession } from './connectPostgres'
import { type building, fiefBuildings, fiefs } from './schema'

type StoredBuilding = (typeof building.enumValues)[number]

type FiefRow = typeof fiefs.$inferSelect

type LevelRow = {
  readonly building: StoredBuilding | null
  readonly level: number | null
}

const storedBuildings: Readonly<Record<BuildingKind, StoredBuilding>> = {
  sawmill: 'sawmill',
  quarry: 'quarry',
  ironMine: 'iron_mine',
  farm: 'farm',
  warehouse: 'warehouse',
}

const buildingKinds: Readonly<Record<StoredBuilding, BuildingKind>> = {
  sawmill: 'sawmill',
  quarry: 'quarry',
  iron_mine: 'ironMine',
  farm: 'farm',
  warehouse: 'warehouse',
}

const uniqueViolation = '23505'

const instantOf = (date: Date): Instant => Instant.fromEpochMilliseconds(date.getTime())

const dateOf = (instant: Instant): Date => new Date(instant.epochMilliseconds)

const buildingLevelsOf = (builtRows: ReadonlyArray<LevelRow>): FiefBuildingLevels => {
  const levels = { sawmill: 0, quarry: 0, ironMine: 0, farm: 0, warehouse: 0 }
  for (const row of builtRows) {
    if (row.building !== null && row.level !== null) {
      levels[buildingKinds[row.building]] = row.level
    }
  }
  return levels
}

const slotOf = (row: FiefRow): BuildSlot => {
  if (row.slotBuilding === null) {
    return { kind: 'idle' }
  }
  if (row.slotLevel === null || row.slotFinishesAt === null) {
    throw new Error(`Fief ${row.id} stores a half-written build slot`)
  }
  return {
    kind: 'busy',
    building: buildingKinds[row.slotBuilding],
    targetLevel: row.slotLevel,
    finishesAt: instantOf(row.slotFinishesAt),
  }
}

const storedFiefOf = (row: FiefRow, levelRows: ReadonlyArray<LevelRow>): StoredFief => ({
  id: row.id,
  playerId: row.playerId,
  name: row.name,
  address: { kingdom: row.kingdom, province: row.province, plot: row.plot },
  stocks: { wood: row.wood, stone: row.stone, iron: row.iron, gold: row.gold, food: row.food },
  storedAt: instantOf(row.storedAt),
  buildingLevels: buildingLevelsOf(levelRows),
  slot: slotOf(row),
})

const slotColumnsOf = (
  slot: BuildSlot,
): Pick<FiefRow, 'slotBuilding' | 'slotLevel' | 'slotFinishesAt'> => {
  if (slot.kind === 'idle') {
    return { slotBuilding: null, slotLevel: null, slotFinishesAt: null }
  }
  return {
    slotBuilding: storedBuildings[slot.building],
    slotLevel: slot.targetLevel,
    slotFinishesAt: dateOf(slot.finishesAt),
  }
}

const fiefRowOf = (fief: Fief): FiefRow => ({
  id: fief.id,
  playerId: fief.playerId,
  kingdom: fief.coordinates.kingdom,
  province: fief.coordinates.province,
  plot: fief.coordinates.plot,
  terrain: fief.terrain,
  name: fief.name.value,
  ...fief.stocks,
  storedAt: dateOf(fief.storedAt),
  ...slotColumnsOf(fief.slot),
})

const isCoordinatesTaken = (failure: unknown): boolean =>
  failure instanceof Error &&
  failure.cause instanceof DatabaseError &&
  failure.cause.code === uniqueViolation &&
  failure.cause.constraint === 'fiefs_coordinates_unique'

export class DrizzleFiefRepository implements FiefRepository {
  constructor(private readonly database: PostgresSession) {}

  async occupiedPlots(): Promise<ReadonlyArray<PlotAddress>> {
    return this.database
      .select({ kingdom: fiefs.kingdom, province: fiefs.province, plot: fiefs.plot })
      .from(fiefs)
  }

  async holdsFief(playerId: PlayerId): Promise<boolean> {
    const held = await this.database
      .select({ id: fiefs.id })
      .from(fiefs)
      .where(eq(fiefs.playerId, playerId))
      .limit(1)
    return held.length > 0
  }

  async fiefOf(playerId: PlayerId): Promise<Result<Fief | undefined, DomainError>> {
    const rows = await this.database
      .select({ fief: fiefs, building: fiefBuildings.building, level: fiefBuildings.level })
      .from(fiefs)
      .leftJoin(fiefBuildings, eq(fiefBuildings.fiefId, fiefs.id))
      .where(eq(fiefs.playerId, playerId))
      .for('update', { of: fiefs })
    const [first] = rows
    if (first === undefined) {
      return ok(undefined)
    }
    return Fief.restore(storedFiefOf(first.fief, rows))
  }

  async save(fief: Fief): Promise<Result<void, DomainError>> {
    const { id, ...changes } = fiefRowOf(fief)
    const builtLevelRows = Object.values(storedBuildings)
      .map((stored) => ({
        fiefId: id,
        building: stored,
        level: fief.buildingLevels[buildingKinds[stored]],
      }))
      .filter((row) => row.level > 0)
    try {
      await this.database.transaction(async (transaction) => {
        await transaction
          .insert(fiefs)
          .values({ id, ...changes })
          .onConflictDoUpdate({ target: fiefs.id, set: changes })
        if (builtLevelRows.length === 0) {
          return
        }
        await transaction
          .insert(fiefBuildings)
          .values(builtLevelRows)
          .onConflictDoUpdate({
            target: [fiefBuildings.fiefId, fiefBuildings.building],
            set: { level: sql`excluded.level` },
          })
      })
      return ok(undefined)
    } catch (failure) {
      if (isCoordinatesTaken(failure)) {
        return err({ kind: 'CoordinatesTaken', coordinates: fief.coordinates })
      }
      throw failure
    }
  }
}
