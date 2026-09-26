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
  type Stocks,
  type StoredFief,
} from '@mygame/domain'
import { eq, sql } from 'drizzle-orm'
import type { PostgresSession } from './connectPostgres'
import { type building, fiefBuildings, fiefs } from './schema'
import { violatedUniqueConstraint } from './violatedUniqueConstraint'

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
  if (row.slotLevel === null || row.slotStartedAt === null || row.slotFinishesAt === null) {
    throw new Error(`Fief ${row.id} stores a half-written build slot`)
  }
  return {
    kind: 'busy',
    building: buildingKinds[row.slotBuilding],
    targetLevel: row.slotLevel,
    startedAt: instantOf(row.slotStartedAt),
    finishesAt: instantOf(row.slotFinishesAt),
    cost: {
      wood: row.slotCostWood,
      stone: row.slotCostStone,
      iron: row.slotCostIron,
      gold: row.slotCostGold,
      food: row.slotCostFood,
    },
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

type SlotCostColumns = Pick<
  FiefRow,
  'slotCostWood' | 'slotCostStone' | 'slotCostIron' | 'slotCostGold' | 'slotCostFood'
>

type SlotColumns = Pick<
  FiefRow,
  'slotBuilding' | 'slotLevel' | 'slotStartedAt' | 'slotFinishesAt'
> &
  SlotCostColumns

const noCost: Stocks = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

const slotCostColumnsOf = (cost: Stocks): SlotCostColumns => ({
  slotCostWood: cost.wood,
  slotCostStone: cost.stone,
  slotCostIron: cost.iron,
  slotCostGold: cost.gold,
  slotCostFood: cost.food,
})

const slotColumnsOf = (slot: BuildSlot): SlotColumns => {
  if (slot.kind === 'idle') {
    return {
      slotBuilding: null,
      slotLevel: null,
      slotStartedAt: null,
      slotFinishesAt: null,
      ...slotCostColumnsOf(noCost),
    }
  }
  return {
    slotBuilding: storedBuildings[slot.building],
    slotLevel: slot.targetLevel,
    slotStartedAt: dateOf(slot.startedAt),
    slotFinishesAt: dateOf(slot.finishesAt),
    ...slotCostColumnsOf(slot.cost),
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

export type FiefRead = 'lockedForUpdate' | 'lockFree'

export class DrizzleFiefRepository implements FiefRepository {
  constructor(
    private readonly database: PostgresSession,
    private readonly read: FiefRead,
  ) {}

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
    const query = this.database
      .select({ fief: fiefs, building: fiefBuildings.building, level: fiefBuildings.level })
      .from(fiefs)
      .leftJoin(fiefBuildings, eq(fiefBuildings.fiefId, fiefs.id))
      .where(eq(fiefs.playerId, playerId))
      .$dynamic()
    const rows = await (this.read === 'lockedForUpdate'
      ? query.for('update', { of: fiefs })
      : query)
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
      const constraint = violatedUniqueConstraint(failure)
      if (constraint === 'fiefs_coordinates_unique') {
        return err({ kind: 'CoordinatesTaken', coordinates: fief.coordinates })
      }
      if (constraint === 'fiefs_player_unique') {
        return err({ kind: 'PlayerAlreadyHoldsFief', playerId: fief.playerId })
      }
      throw failure
    }
  }
}
