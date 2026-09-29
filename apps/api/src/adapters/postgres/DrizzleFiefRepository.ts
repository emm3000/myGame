import {
  type AwayMarch,
  type BuildQueue,
  type BuildSlot,
  type DomainError,
  err,
  Fief,
  type FiefArtLevels,
  type FiefBuildingLevels,
  type FiefRepository,
  Instant,
  type March,
  ok,
  type PlayerId,
  type PlotAddress,
  type RecruitOrder,
  type Result,
  type Stocks,
  type StoredFief,
  type StudySlot,
} from '@mygame/domain'
import { and, eq, inArray, sql } from 'drizzle-orm'
import type { PostgresSession } from './connectPostgres'
import { isCampTier } from './isCampTier'
import {
  fiefArts,
  fiefBuildings,
  fiefMarches,
  fiefQueueEntries,
  fiefRecruitOrders,
  fiefs,
  fiefUnits,
} from './schema'
import {
  artKinds,
  buildingKinds,
  type StoredArt,
  type StoredBuilding,
  type StoredUnit,
  storedArts,
  storedBuildings,
  storedUnits,
  unitKinds,
} from './storedKinds'
import { violatedUniqueConstraint } from './violatedUniqueConstraint'

type FiefRow = typeof fiefs.$inferSelect

type EntryRow = typeof fiefQueueEntries.$inferSelect

type RecruitOrderRow = typeof fiefRecruitOrders.$inferSelect

type MarchRow = typeof fiefMarches.$inferSelect

type JoinedRow = {
  readonly building: StoredBuilding | null
  readonly level: number | null
  readonly entry: EntryRow | null
  readonly art: StoredArt | null
  readonly artLevel: number | null
  readonly unit: StoredUnit | null
  readonly unitCount: number | null
  readonly recruitOrder: RecruitOrderRow | null
  readonly march: MarchRow | null
}

const instantOf = (date: Date): Instant => Instant.fromEpochMilliseconds(date.getTime())

const dateOf = (instant: Instant): Date => new Date(instant.epochMilliseconds)

const buildingLevelsOf = (builtRows: ReadonlyArray<JoinedRow>): FiefBuildingLevels => {
  const levels = {
    sawmill: 0,
    quarry: 0,
    ironMine: 0,
    farm: 0,
    warehouse: 0,
    library: 0,
    barracks: 0,
  }
  for (const row of builtRows) {
    if (row.building !== null && row.level !== null) {
      levels[buildingKinds[row.building]] = row.level
    }
  }
  return levels
}

const artLevelsOf = (joinedRows: ReadonlyArray<JoinedRow>): FiefArtLevels => {
  const levels = { smithing: 0, masonry: 0 }
  for (const row of joinedRows) {
    if (row.art !== null && row.artLevel !== null) {
      levels[artKinds[row.art]] = row.artLevel
    }
  }
  return levels
}

const unitCountsOf = (joinedRows: ReadonlyArray<JoinedRow>): StoredFief['units'] => {
  const counts = { infantry: 0 }
  for (const row of joinedRows) {
    if (row.unit !== null && row.unitCount !== null) {
      counts[unitKinds[row.unit]] = row.unitCount
    }
  }
  return counts
}

const recruitOrderOf = (row: RecruitOrderRow | null): RecruitOrder => {
  if (row === null) {
    return { kind: 'idle' }
  }
  return {
    kind: 'open',
    unit: unitKinds[row.kind],
    count: row.count,
    cost: {
      wood: row.costWood,
      stone: row.costStone,
      iron: row.costIron,
      gold: row.costGold,
      food: row.costFood,
    },
    perUnitSeconds: row.perUnitSeconds,
    startedAt: instantOf(row.startedAt),
  }
}

const recruitOrderRowOf = (fief: Fief): RecruitOrderRow | undefined => {
  const { recruitOrder } = fief
  if (recruitOrder.kind === 'idle') {
    return undefined
  }
  return {
    fiefId: fief.id,
    kind: storedUnits[recruitOrder.unit],
    count: recruitOrder.count,
    costWood: recruitOrder.cost.wood,
    costStone: recruitOrder.cost.stone,
    costIron: recruitOrder.cost.iron,
    costGold: recruitOrder.cost.gold,
    costFood: recruitOrder.cost.food,
    perUnitSeconds: recruitOrder.perUnitSeconds,
    startedAt: dateOf(recruitOrder.startedAt),
  }
}

type AttackMarch = Extract<AwayMarch, { readonly order: 'attack' }>

type MarchOrderColumns = Pick<MarchRow, 'marchOrder' | 'campTier' | 'campStrength' | 'fought'>

const attackedCampOf = (row: MarchRow): AttackMarch['camp'] => {
  if (row.campTier === null || row.campStrength === null || !isCampTier(row.campTier)) {
    throw new Error(`Fief ${row.fiefId} stores an attack march without its camp`)
  }
  return { tier: row.campTier, strength: row.campStrength }
}

const marchOf = (row: MarchRow | null): March => {
  if (row === null) {
    return { kind: 'idle' }
  }
  const road = {
    kind: 'away',
    province: row.province,
    plot: row.plot,
    infantry: row.infantry,
    stayHours: row.stayHours,
    departedAt: instantOf(row.departedAt),
    oneWaySeconds: row.oneWaySeconds,
    loot: {
      wood: row.lootWood,
      stone: row.lootStone,
      iron: row.lootIron,
      gold: row.lootGold,
      food: row.lootFood,
    },
    ...(row.recalledAt === null ? {} : { recalledAt: instantOf(row.recalledAt) }),
  } satisfies Omit<AwayMarch, 'order'>
  if (row.marchOrder === 'forage') {
    return { ...road, order: 'forage' }
  }
  return { ...road, order: 'attack', camp: attackedCampOf(row), fought: row.fought }
}

const marchOrderColumnsOf = (march: AwayMarch): MarchOrderColumns => {
  if (march.order === 'forage') {
    return { marchOrder: 'forage', campTier: null, campStrength: null, fought: false }
  }
  return {
    marchOrder: 'attack',
    campTier: march.camp.tier,
    campStrength: march.camp.strength,
    fought: march.fought,
  }
}

const marchRowOf = (fief: Fief): MarchRow | undefined => {
  const { march } = fief
  if (march.kind === 'idle') {
    return undefined
  }
  return {
    fiefId: fief.id,
    province: march.province,
    plot: march.plot,
    infantry: march.infantry,
    stayHours: march.stayHours,
    oneWaySeconds: march.oneWaySeconds,
    departedAt: dateOf(march.departedAt),
    lootWood: march.loot.wood,
    lootStone: march.loot.stone,
    lootIron: march.loot.iron,
    lootGold: march.loot.gold,
    lootFood: march.loot.food,
    recalledAt: march.recalledAt === undefined ? null : dateOf(march.recalledAt),
    ...marchOrderColumnsOf(march),
  }
}

const buildQueueOf = (joinedRows: ReadonlyArray<JoinedRow>): BuildQueue => {
  const entriesByPosition = new Map<number, EntryRow>()
  for (const { entry } of joinedRows) {
    if (entry !== null) {
      entriesByPosition.set(entry.position, entry)
    }
  }
  return [...entriesByPosition.values()]
    .sort((left, right) => left.position - right.position)
    .map((entry) => ({
      building: buildingKinds[entry.building],
      targetLevel: entry.targetLevel,
      cost: {
        wood: entry.costWood,
        stone: entry.costStone,
        iron: entry.costIron,
        gold: entry.costGold,
        food: entry.costFood,
      },
      durationSeconds: entry.durationSeconds,
    }))
}

const entryRowsOf = (fief: Fief): ReadonlyArray<EntryRow> =>
  fief.buildQueue.map((entry, position) => ({
    fiefId: fief.id,
    position,
    building: storedBuildings[entry.building],
    targetLevel: entry.targetLevel,
    costWood: entry.cost.wood,
    costStone: entry.cost.stone,
    costIron: entry.cost.iron,
    costGold: entry.cost.gold,
    costFood: entry.cost.food,
    durationSeconds: entry.durationSeconds,
  }))

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

const studySlotOf = (row: FiefRow): StudySlot => {
  if (row.studyArt === null) {
    return { kind: 'idle' }
  }
  if (row.studyLevel === null || row.studyStartedAt === null || row.studyFinishesAt === null) {
    throw new Error(`Fief ${row.id} stores a half-written study slot`)
  }
  return {
    kind: 'busy',
    art: artKinds[row.studyArt],
    targetLevel: row.studyLevel,
    startedAt: instantOf(row.studyStartedAt),
    finishesAt: instantOf(row.studyFinishesAt),
    cost: {
      wood: row.studyCostWood,
      stone: row.studyCostStone,
      iron: row.studyCostIron,
      gold: row.studyCostGold,
      food: row.studyCostFood,
    },
  }
}

const storedFiefOf = (
  row: FiefRow,
  recruitOrder: RecruitOrderRow | null,
  march: MarchRow | null,
  joinedRows: ReadonlyArray<JoinedRow>,
): StoredFief => ({
  id: row.id,
  playerId: row.playerId,
  name: row.name,
  address: { kingdom: row.kingdom, province: row.province, plot: row.plot },
  stocks: { wood: row.wood, stone: row.stone, iron: row.iron, gold: row.gold, food: row.food },
  storedAt: instantOf(row.storedAt),
  buildingLevels: buildingLevelsOf(joinedRows),
  artLevels: artLevelsOf(joinedRows),
  units: unitCountsOf(joinedRows),
  slot: slotOf(row),
  buildQueue: buildQueueOf(joinedRows),
  studySlot: studySlotOf(row),
  recruitOrder: recruitOrderOf(recruitOrder),
  march: marchOf(march),
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

type StudyCostColumns = Pick<
  FiefRow,
  'studyCostWood' | 'studyCostStone' | 'studyCostIron' | 'studyCostGold' | 'studyCostFood'
>

type StudyColumns = Pick<
  FiefRow,
  'studyArt' | 'studyLevel' | 'studyStartedAt' | 'studyFinishesAt'
> &
  StudyCostColumns

const studyCostColumnsOf = (cost: Stocks): StudyCostColumns => ({
  studyCostWood: cost.wood,
  studyCostStone: cost.stone,
  studyCostIron: cost.iron,
  studyCostGold: cost.gold,
  studyCostFood: cost.food,
})

const studyColumnsOf = (studySlot: StudySlot): StudyColumns => {
  if (studySlot.kind === 'idle') {
    return {
      studyArt: null,
      studyLevel: null,
      studyStartedAt: null,
      studyFinishesAt: null,
      ...studyCostColumnsOf(noCost),
    }
  }
  return {
    studyArt: storedArts[studySlot.art],
    studyLevel: studySlot.targetLevel,
    studyStartedAt: dateOf(studySlot.startedAt),
    studyFinishesAt: dateOf(studySlot.finishesAt),
    ...studyCostColumnsOf(studySlot.cost),
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
  ...studyColumnsOf(fief.studySlot),
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
      .select({
        fief: fiefs,
        building: fiefBuildings.building,
        level: fiefBuildings.level,
        entry: fiefQueueEntries,
        art: fiefArts.art,
        artLevel: fiefArts.level,
        unit: fiefUnits.kind,
        unitCount: fiefUnits.count,
        recruitOrder: fiefRecruitOrders,
        march: fiefMarches,
      })
      .from(fiefs)
      .leftJoin(fiefBuildings, eq(fiefBuildings.fiefId, fiefs.id))
      .leftJoin(fiefQueueEntries, eq(fiefQueueEntries.fiefId, fiefs.id))
      .leftJoin(fiefArts, eq(fiefArts.fiefId, fiefs.id))
      .leftJoin(fiefUnits, eq(fiefUnits.fiefId, fiefs.id))
      .leftJoin(fiefRecruitOrders, eq(fiefRecruitOrders.fiefId, fiefs.id))
      .leftJoin(fiefMarches, eq(fiefMarches.fiefId, fiefs.id))
      .where(eq(fiefs.playerId, playerId))
      .$dynamic()
    const rows = await (this.read === 'lockedForUpdate'
      ? query.for('update', { of: fiefs })
      : query)
    const [first] = rows
    if (first === undefined) {
      return ok(undefined)
    }
    return Fief.restore(storedFiefOf(first.fief, first.recruitOrder, first.march, rows))
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
    const studiedArtRows = Object.values(storedArts)
      .map((stored) => ({ fiefId: id, art: stored, level: fief.artLevels[artKinds[stored]] }))
      .filter((row) => row.level > 0)
    const unitRows = Object.values(storedUnits).map((stored) => ({
      fiefId: id,
      kind: stored,
      count: fief.units.countOf(unitKinds[stored]),
    }))
    const countedUnitRows = unitRows.filter((row) => row.count > 0)
    const emptiedUnits = unitRows.filter((row) => row.count === 0).map((row) => row.kind)
    const recruitOrderRow = recruitOrderRowOf(fief)
    const marchRow = marchRowOf(fief)
    const entryRows = entryRowsOf(fief)
    try {
      await this.database.transaction(async (transaction) => {
        await transaction
          .insert(fiefs)
          .values({ id, ...changes })
          .onConflictDoUpdate({ target: fiefs.id, set: changes })
        if (builtLevelRows.length > 0) {
          await transaction
            .insert(fiefBuildings)
            .values(builtLevelRows)
            .onConflictDoUpdate({
              target: [fiefBuildings.fiefId, fiefBuildings.building],
              set: { level: sql`excluded.level` },
            })
        }
        if (studiedArtRows.length > 0) {
          await transaction
            .insert(fiefArts)
            .values(studiedArtRows)
            .onConflictDoUpdate({
              target: [fiefArts.fiefId, fiefArts.art],
              set: { level: sql`excluded.level` },
            })
        }
        if (countedUnitRows.length > 0) {
          await transaction
            .insert(fiefUnits)
            .values(countedUnitRows)
            .onConflictDoUpdate({
              target: [fiefUnits.fiefId, fiefUnits.kind],
              set: { count: sql`excluded.count` },
            })
        }
        if (emptiedUnits.length > 0) {
          await transaction
            .delete(fiefUnits)
            .where(and(eq(fiefUnits.fiefId, id), inArray(fiefUnits.kind, emptiedUnits)))
        }
        await transaction.delete(fiefQueueEntries).where(eq(fiefQueueEntries.fiefId, id))
        if (entryRows.length > 0) {
          await transaction.insert(fiefQueueEntries).values([...entryRows])
        }
        await transaction.delete(fiefRecruitOrders).where(eq(fiefRecruitOrders.fiefId, id))
        if (recruitOrderRow !== undefined) {
          await transaction.insert(fiefRecruitOrders).values(recruitOrderRow)
        }
        await transaction.delete(fiefMarches).where(eq(fiefMarches.fiefId, id))
        if (marchRow !== undefined) {
          await transaction.insert(fiefMarches).values(marchRow)
        }
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
