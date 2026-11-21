import {
  type BuildingKind,
  type BuildingLevels,
  Instant,
  idleWorkSlot,
  type WaitingList,
  type WorkSlot,
} from '@mygame/domain'
import { z } from 'zod'
import { stocksFromRow } from './stocksFromRow'
import { type TownRow, townBuilding } from './townTables'

type StoredTownBuilding = (typeof townBuilding.enumValues)[number]

const AggregatedLevelsSchema = z.array(
  z.strictObject({ building: z.enum(townBuilding.enumValues), level: z.number().int() }),
)

const AggregatedWaitingWorkSchema = z.array(
  z.strictObject({
    building: z.enum(townBuilding.enumValues),
    level: z.number().int(),
    costMoney: z.number(),
    costFood: z.number(),
    costPower: z.number(),
    costMaterial: z.number(),
    durationSeconds: z.number().int(),
  }),
)

export const buildingKindOf: Readonly<Record<StoredTownBuilding, BuildingKind>> = {
  homes: 'homes',
  farm: 'farm',
  factory: 'factory',
  power_station: 'powerStation',
  storage: 'storage',
  school: 'school',
  office: 'office',
}

export const buildingLevelsFromRow = (aggregate: unknown): BuildingLevels => {
  const levels: Record<BuildingKind, number> = {
    homes: 0,
    farm: 0,
    factory: 0,
    powerStation: 0,
    storage: 0,
    school: 0,
    office: 0,
  }
  for (const { building, level } of AggregatedLevelsSchema.parse(aggregate)) {
    levels[buildingKindOf[building]] = level
  }
  return levels
}

export const waitingListFromRow = (aggregate: unknown): WaitingList =>
  AggregatedWaitingWorkSchema.parse(aggregate).map((work) => ({
    building: buildingKindOf[work.building],
    level: work.level,
    cost: stocksFromRow(work.costMoney, work.costFood, work.costPower, work.costMaterial),
    durationSeconds: work.durationSeconds,
  }))

export const workSlotFromRow = (row: TownRow): WorkSlot => {
  const {
    workBuilding,
    workLevel,
    workStartedAt,
    workFinishesAt,
    workCostMoney,
    workCostFood,
    workCostPower,
    workCostMaterial,
  } = row
  if (workBuilding === null) {
    return idleWorkSlot
  }
  if (
    workLevel === null ||
    workStartedAt === null ||
    workFinishesAt === null ||
    workCostMoney === null ||
    workCostFood === null ||
    workCostPower === null ||
    workCostMaterial === null
  ) {
    throw new Error(`Town ${row.id} stores a half-written work slot`)
  }
  return {
    kind: 'busy',
    building: buildingKindOf[workBuilding],
    level: workLevel,
    cost: stocksFromRow(workCostMoney, workCostFood, workCostPower, workCostMaterial),
    startedAt: Instant.fromEpochMilliseconds(workStartedAt.getTime()),
    finishesAt: Instant.fromEpochMilliseconds(workFinishesAt.getTime()),
  }
}
