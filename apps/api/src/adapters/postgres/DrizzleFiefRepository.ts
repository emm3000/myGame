import {
  type AwayMarch,
  type BuildQueue,
  type BuildSlot,
  byUnitKind,
  type DomainError,
  type EarnedSkill,
  err,
  Fief,
  type FiefArtLevels,
  type FiefBuildingLevels,
  type FiefId,
  type FiefRepository,
  type HeldCard,
  type IncomingCargo,
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
import { and, asc, eq, inArray, isNotNull, isNull, type SQL, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { FiefWithCards } from '../../fief/FiefReader'
import { byEarnedAt } from '../byEarnedAt'
import { aggregatedCardsOf, heldCardsOf } from './aggregatedCards'
import type { PostgresSession } from './connectPostgres'
import { isCampTier } from './isCampTier'
import {
  fiefArts,
  fiefBuildings,
  fiefIncomingCargo,
  fiefMarches,
  fiefQueueEntries,
  fiefRecruitOrders,
  fiefs,
  fiefUnits,
  playerSkills,
  resource,
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

type IncomingCargoRow = typeof fiefIncomingCargo.$inferSelect

type SkillRow = typeof playerSkills.$inferSelect

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
  readonly incomingCargo: IncomingCargoRow | null
}

const instantOf = (date: Date): Instant => Instant.fromEpochMilliseconds(date.getTime())

const dateOf = (instant: Instant): Date => new Date(instant.epochMilliseconds)

const instantOrNullOf = (date: Date | null): Instant | null =>
  date === null ? null : instantOf(date)

const dateOrNullOf = (instant: Instant | null): Date | null =>
  instant === null ? null : dateOf(instant)

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
  const counts = { ...byUnitKind(() => 0) }
  for (const row of joinedRows) {
    if (row.unit !== null && row.unitCount !== null) {
      counts[unitKinds[row.unit]] = row.unitCount
    }
  }
  return counts
}

const AggregatedSkillsSchema = z.array(
  z.strictObject({
    lessonId: z.string(),
    resource: z.enum(resource.enumValues),
    ratePercent: z.number().int(),
    earnedAt: z.string(),
  }),
)

const aggregatedSkills = sql<unknown>`(SELECT coalesce(json_agg(json_build_object('lessonId', ${playerSkills.lessonId}, 'resource', ${playerSkills.resource}, 'ratePercent', ${playerSkills.ratePercent}, 'earnedAt', ${playerSkills.earnedAt})), '[]'::json) FROM ${playerSkills} WHERE ${playerSkills.playerId} = ${fiefs.playerId})`

const skillsOf = (aggregate: unknown): ReadonlyArray<EarnedSkill> =>
  AggregatedSkillsSchema.parse(aggregate)
    .map((skill) => ({
      ...skill,
      earnedAt: Instant.fromEpochMilliseconds(Date.parse(skill.earnedAt)),
    }))
    .sort(byEarnedAt)

const skillRowsOf = (fief: Fief): ReadonlyArray<SkillRow> =>
  fief.skills.map((skill) => ({
    playerId: fief.playerId,
    lessonId: skill.lessonId,
    resource: skill.resource,
    ratePercent: skill.ratePercent,
    earnedAt: dateOf(skill.earnedAt),
  }))

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

type CargoColumns = Pick<
  MarchRow,
  'toFiefId' | 'cargoWood' | 'cargoStone' | 'cargoIron' | 'cargoGold' | 'cargoFood'
>

type MarchOrderColumns = Pick<
  MarchRow,
  'marchOrder' | 'campTier' | 'campStrength' | 'fought' | 'foundingName'
> &
  CargoColumns

type TransportMarch = Extract<AwayMarch, { readonly order: 'transport' }>

const attackedCampOf = (row: MarchRow): AttackMarch['camp'] => {
  if (row.campTier === null || row.campStrength === null || !isCampTier(row.campTier)) {
    throw new Error(`Fief ${row.fiefId} stores an attack march without its camp`)
  }
  return { tier: row.campTier, strength: row.campStrength }
}

const foundingNameOf = (row: MarchRow): string => {
  if (row.foundingName === null) {
    throw new Error(`Fief ${row.fiefId} stores a founding march without its name`)
  }
  return row.foundingName
}

const transportOf = (row: MarchRow): Pick<TransportMarch, 'toFiefId' | 'cargo'> => {
  const { toFiefId, cargoWood, cargoStone, cargoIron, cargoGold, cargoFood } = row
  if (
    toFiefId === null ||
    cargoWood === null ||
    cargoStone === null ||
    cargoIron === null ||
    cargoGold === null ||
    cargoFood === null
  ) {
    throw new Error(`Fief ${row.fiefId} stores a transport march without its cargo`)
  }
  return {
    toFiefId,
    cargo: {
      wood: cargoWood,
      stone: cargoStone,
      iron: cargoIron,
      gold: cargoGold,
      food: cargoFood,
    },
  }
}

const marchOf = (row: MarchRow | null): March => {
  if (row === null) {
    return { kind: 'idle' }
  }
  const road = {
    kind: 'away',
    province: row.province,
    plot: row.plot,
    units: {
      infantry: row.infantryCount,
      cavalry: row.cavalryCount,
      archer: row.archerCount,
      settler: row.settlerCount,
    },
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
    lootPercent: {
      wood: row.lootPercentWood,
      stone: row.lootPercentStone,
      iron: row.lootPercentIron,
      gold: row.lootPercentGold,
      food: row.lootPercentFood,
    },
    ...(row.recalledAt === null ? {} : { recalledAt: instantOf(row.recalledAt) }),
  } satisfies Omit<AwayMarch, 'order'>
  switch (row.marchOrder) {
    case 'forage':
      return { ...road, order: 'forage' }
    case 'attack':
      return { ...road, order: 'attack', camp: attackedCampOf(row), fought: row.fought }
    case 'found':
      return { ...road, order: 'found', name: foundingNameOf(row) }
    case 'transport':
      return { ...road, order: 'transport', ...transportOf(row) }
    default: {
      const unreachable: never = row.marchOrder
      return unreachable
    }
  }
}

const unfoughtColumns: Pick<MarchRow, 'campTier' | 'campStrength' | 'fought'> = {
  campTier: null,
  campStrength: null,
  fought: false,
}

const noCargoColumns: CargoColumns = {
  toFiefId: null,
  cargoWood: null,
  cargoStone: null,
  cargoIron: null,
  cargoGold: null,
  cargoFood: null,
}

const marchOrderColumnsOf = (march: AwayMarch): MarchOrderColumns => {
  switch (march.order) {
    case 'forage':
      return { marchOrder: 'forage', ...unfoughtColumns, foundingName: null, ...noCargoColumns }
    case 'attack':
      return {
        marchOrder: 'attack',
        campTier: march.camp.tier,
        campStrength: march.camp.strength,
        fought: march.fought,
        foundingName: null,
        ...noCargoColumns,
      }
    case 'found':
      return {
        marchOrder: 'found',
        ...unfoughtColumns,
        foundingName: march.name,
        ...noCargoColumns,
      }
    case 'transport':
      return {
        marchOrder: 'transport',
        ...unfoughtColumns,
        foundingName: null,
        toFiefId: march.toFiefId,
        cargoWood: march.cargo.wood,
        cargoStone: march.cargo.stone,
        cargoIron: march.cargo.iron,
        cargoGold: march.cargo.gold,
        cargoFood: march.cargo.food,
      }
    default: {
      const unreachable: never = march
      return unreachable
    }
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
    infantryCount: march.units.infantry,
    cavalryCount: march.units.cavalry,
    archerCount: march.units.archer,
    settlerCount: march.units.settler,
    stayHours: march.stayHours,
    oneWaySeconds: march.oneWaySeconds,
    departedAt: dateOf(march.departedAt),
    lootWood: march.loot.wood,
    lootStone: march.loot.stone,
    lootIron: march.loot.iron,
    lootGold: march.loot.gold,
    lootFood: march.loot.food,
    lootPercentWood: march.lootPercent.wood,
    lootPercentStone: march.lootPercent.stone,
    lootPercentIron: march.lootPercent.iron,
    lootPercentGold: march.lootPercent.gold,
    lootPercentFood: march.lootPercent.food,
    recalledAt: march.recalledAt === undefined ? null : dateOf(march.recalledAt),
    ...marchOrderColumnsOf(march),
  }
}

const incomingCargoOf = (row: IncomingCargoRow): IncomingCargo => ({
  fromFiefId: row.fromFiefId,
  name: row.fromName,
  province: row.fromProvince,
  plot: row.fromPlot,
  cargo: {
    wood: row.cargoWood,
    stone: row.cargoStone,
    iron: row.cargoIron,
    gold: row.cargoGold,
    food: row.cargoFood,
  },
  departedAt: instantOf(row.departedAt),
  arrivesAt: instantOf(row.arrivesAt),
})

const incomingCargoRowOf = (fief: Fief): IncomingCargoRow | undefined => {
  const { incomingCargo } = fief
  if (incomingCargo === undefined) {
    return undefined
  }
  return {
    fiefId: fief.id,
    fromFiefId: incomingCargo.fromFiefId,
    fromName: incomingCargo.name,
    fromProvince: incomingCargo.province,
    fromPlot: incomingCargo.plot,
    cargoWood: incomingCargo.cargo.wood,
    cargoStone: incomingCargo.cargo.stone,
    cargoIron: incomingCargo.cargo.iron,
    cargoGold: incomingCargo.cargo.gold,
    cargoFood: incomingCargo.cargo.food,
    departedAt: dateOf(incomingCargo.departedAt),
    arrivesAt: dateOf(incomingCargo.arrivesAt),
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

const lessonStudySlotOf = (row: FiefRow, lessonId: string): StudySlot => {
  if (row.studyStartedAt === null || row.studyFinishesAt === null) {
    throw new Error(`Fief ${row.id} stores a half-written lesson study`)
  }
  return {
    kind: 'lesson',
    lessonId,
    startedAt: instantOf(row.studyStartedAt),
    finishesAt: instantOf(row.studyFinishesAt),
  }
}

const studySlotOf = (row: FiefRow): StudySlot => {
  if (row.studyLessonId !== null) {
    return lessonStudySlotOf(row, row.studyLessonId)
  }
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
  incomingCargo: IncomingCargoRow | null,
  joinedRows: ReadonlyArray<JoinedRow>,
  skills: unknown,
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
  ...(incomingCargo === null ? {} : { incomingCargo: incomingCargoOf(incomingCargo) }),
  fullSince: {
    wood: instantOrNullOf(row.fullSinceWood),
    stone: instantOrNullOf(row.fullSinceStone),
    iron: instantOrNullOf(row.fullSinceIron),
    gold: instantOrNullOf(row.fullSinceGold),
    food: instantOrNullOf(row.fullSinceFood),
  },
  guidanceDismissedAt: instantOrNullOf(row.guidanceDismissedAt),
  skills: skillsOf(skills),
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
  'studyArt' | 'studyLevel' | 'studyStartedAt' | 'studyFinishesAt' | 'studyLessonId'
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
  switch (studySlot.kind) {
    case 'idle':
      return {
        studyArt: null,
        studyLevel: null,
        studyStartedAt: null,
        studyFinishesAt: null,
        studyLessonId: null,
        ...studyCostColumnsOf(noCost),
      }
    case 'busy':
      return {
        studyArt: storedArts[studySlot.art],
        studyLevel: studySlot.targetLevel,
        studyStartedAt: dateOf(studySlot.startedAt),
        studyFinishesAt: dateOf(studySlot.finishesAt),
        studyLessonId: null,
        ...studyCostColumnsOf(studySlot.cost),
      }
    case 'lesson':
      return {
        studyArt: null,
        studyLevel: null,
        studyStartedAt: dateOf(studySlot.startedAt),
        studyFinishesAt: dateOf(studySlot.finishesAt),
        studyLessonId: studySlot.lessonId,
        ...studyCostColumnsOf(noCost),
      }
    default: {
      const unreachable: never = studySlot
      return unreachable
    }
  }
}

type SavedFiefRow = Omit<FiefRow, 'guidanceDismissedAt'>

const fiefRowOf = (fief: Fief): SavedFiefRow => ({
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
  fullSinceWood: dateOrNullOf(fief.fullSince.wood),
  fullSinceStone: dateOrNullOf(fief.fullSince.stone),
  fullSinceIron: dateOrNullOf(fief.fullSince.iron),
  fullSinceGold: dateOrNullOf(fief.fullSince.gold),
  fullSinceFood: dateOrNullOf(fief.fullSince.food),
})

export type FiefRead = 'lockedForUpdate' | 'lockFree'

export class DrizzleFiefRepository implements FiefRepository {
  constructor(
    private readonly database: PostgresSession,
    private readonly read: FiefRead,
  ) {}

  async occupiedPlots(): Promise<ReadonlyArray<PlotAddress>> {
    const held = await this.database
      .select({ kingdom: fiefs.kingdom, province: fiefs.province, plot: fiefs.plot })
      .from(fiefs)
    const reserved = await this.database
      .select({ kingdom: fiefs.kingdom, province: fiefMarches.province, plot: fiefMarches.plot })
      .from(fiefMarches)
      .innerJoin(fiefs, eq(fiefs.id, fiefMarches.fiefId))
      .where(and(isNotNull(fiefMarches.foundingName), isNull(fiefMarches.recalledAt)))
    return [...held, ...reserved]
  }

  async holdsFief(playerId: PlayerId): Promise<boolean> {
    const held = await this.database
      .select({ id: fiefs.id })
      .from(fiefs)
      .where(eq(fiefs.playerId, playerId))
      .limit(1)
    return held.length > 0
  }

  async fiefsOf(playerId: PlayerId): Promise<ReadonlyArray<FiefId>> {
    const held = await this.database
      .select({ id: fiefs.id })
      .from(fiefs)
      .where(eq(fiefs.playerId, playerId))
      .orderBy(asc(fiefs.province), asc(fiefs.plot))
    return held.map(({ id }) => id)
  }

  async foundingsOnTheRoadOf(playerId: PlayerId): Promise<number> {
    const foundings = await this.database
      .select({ fiefId: fiefMarches.fiefId })
      .from(fiefMarches)
      .innerJoin(fiefs, eq(fiefs.id, fiefMarches.fiefId))
      .where(
        and(
          eq(fiefs.playerId, playerId),
          isNotNull(fiefMarches.foundingName),
          isNull(fiefMarches.recalledAt),
        ),
      )
    return foundings.length
  }

  async fiefOf(fiefId: FiefId): Promise<Result<Fief | undefined, DomainError>> {
    const rows = await this.joinedRowsOf(fiefId, sql<unknown>`NULL`)
    const [first] = rows
    if (first === undefined) {
      return ok(undefined)
    }
    return Fief.restore(
      storedFiefOf(
        first.fief,
        first.recruitOrder,
        first.march,
        first.incomingCargo,
        rows,
        first.skills,
      ),
    )
  }

  async fiefWithCardsOf(fiefId: FiefId): Promise<Result<FiefWithCards | undefined, DomainError>> {
    const rows = await this.joinedRowsOf(fiefId, aggregatedCardsOf(fiefs.playerId))
    const [first] = rows
    if (first === undefined) {
      return ok(undefined)
    }
    const fief = Fief.restore(
      storedFiefOf(
        first.fief,
        first.recruitOrder,
        first.march,
        first.incomingCargo,
        rows,
        first.skills,
      ),
    )
    if (!fief.ok) {
      return fief
    }
    const cards: Result<ReadonlyArray<HeldCard>, DomainError> = heldCardsOf(
      first.cards,
      first.fief.playerId,
    )
    if (!cards.ok) {
      return cards
    }
    return ok({ fief: fief.value, cards: cards.value })
  }

  private async joinedRowsOf(fiefId: FiefId, cards: SQL<unknown>) {
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
        incomingCargo: fiefIncomingCargo,
        skills: aggregatedSkills,
        cards,
      })
      .from(fiefs)
      .leftJoin(fiefBuildings, eq(fiefBuildings.fiefId, fiefs.id))
      .leftJoin(fiefQueueEntries, eq(fiefQueueEntries.fiefId, fiefs.id))
      .leftJoin(fiefArts, eq(fiefArts.fiefId, fiefs.id))
      .leftJoin(fiefUnits, eq(fiefUnits.fiefId, fiefs.id))
      .leftJoin(fiefRecruitOrders, eq(fiefRecruitOrders.fiefId, fiefs.id))
      .leftJoin(fiefMarches, eq(fiefMarches.fiefId, fiefs.id))
      .leftJoin(fiefIncomingCargo, eq(fiefIncomingCargo.fiefId, fiefs.id))
      .where(eq(fiefs.id, fiefId))
      .$dynamic()
    return this.read === 'lockedForUpdate' ? query.for('update', { of: fiefs }) : query
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
    const incomingCargoRow = incomingCargoRowOf(fief)
    const entryRows = entryRowsOf(fief)
    const skillRows = skillRowsOf(fief)
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
        await transaction.delete(fiefIncomingCargo).where(eq(fiefIncomingCargo.fiefId, id))
        if (incomingCargoRow !== undefined) {
          await transaction.insert(fiefIncomingCargo).values(incomingCargoRow)
        }
        if (skillRows.length > 0) {
          await transaction
            .insert(playerSkills)
            .values([...skillRows])
            .onConflictDoNothing({ target: [playerSkills.playerId, playerSkills.lessonId] })
        }
      })
      return ok(undefined)
    } catch (failure) {
      const constraint = violatedUniqueConstraint(failure)
      if (constraint === 'fiefs_coordinates_unique') {
        return err({ kind: 'CoordinatesTaken', coordinates: fief.coordinates })
      }
      if (constraint === 'fief_marches_founding_plot_unique' && marchRow !== undefined) {
        return err({ kind: 'PlotReserved', province: marchRow.province, plot: marchRow.plot })
      }
      throw failure
    }
  }
}
