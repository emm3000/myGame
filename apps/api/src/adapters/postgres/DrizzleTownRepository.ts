import { type DomainError, err, Instant, ok, type PlayerId, type Result } from '@mygame/domain'
import {
  type BuildingKind,
  type BuildingLevels,
  buildingKinds,
  type FullSince,
  idleWorkSlot,
  type SiteAddress,
  type Stocks,
  Town,
  TownAddress,
  TownName,
  type TownRepository,
  type TownSkill,
  type WaitingList,
  type WorkSlot,
} from '@mygame/domain/town'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { TownReader, TownWithSchool } from '../../town/TownReader'
import { byEarnedAt } from '../byEarnedAt'
import { aggregatedCardsOf, heldCardsOf } from './aggregatedCards'
import type { PostgresSession } from './connectPostgres'
import { jsonAggregateOf } from './jsonAggregateOf'
import { lessonSlotOf } from './lessonSlotOf'
import {
  earnedSkills,
  townBuilding,
  townBuildings,
  townLessonSlots,
  townResource,
  towns,
  townWaitingWork,
} from './schema'
import { violatedUniqueConstraint } from './violatedUniqueConstraint'

export type TownRead = 'lockedForUpdate' | 'lockFree'

type StoredTownBuilding = (typeof townBuilding.enumValues)[number]

type TownRow = typeof towns.$inferSelect

type WaitingRow = typeof townWaitingWork.$inferSelect

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

const aggregatedLevels = jsonAggregateOf(
  townBuildings,
  { building: townBuildings.building, level: townBuildings.level },
  eq(townBuildings.townId, towns.id),
  sql`${townBuildings.building}`,
)

const aggregatedWaitingWork = jsonAggregateOf(
  townWaitingWork,
  {
    building: townWaitingWork.building,
    level: townWaitingWork.level,
    costMoney: townWaitingWork.costMoney,
    costFood: townWaitingWork.costFood,
    costPower: townWaitingWork.costPower,
    costMaterial: townWaitingWork.costMaterial,
    durationSeconds: townWaitingWork.durationSeconds,
  },
  eq(townWaitingWork.townId, towns.id),
  sql`${townWaitingWork.position}`,
)

const AggregatedSkillsSchema = z.array(
  z.strictObject({
    lessonId: z.string(),
    resource: z.enum(townResource.enumValues),
    ratePercent: z.number().int(),
    earnedAt: z.string(),
  }),
)

const aggregatedSkills = jsonAggregateOf(
  earnedSkills,
  {
    lessonId: earnedSkills.lessonId,
    resource: earnedSkills.resource,
    ratePercent: earnedSkills.ratePercent,
    earnedAt: earnedSkills.earnedAt,
  },
  eq(earnedSkills.playerId, towns.playerId),
  sql`${earnedSkills.earnedAt}, ${earnedSkills.lessonId} COLLATE "C"`,
)

const skillsOf = (aggregate: unknown): ReadonlyArray<TownSkill> =>
  AggregatedSkillsSchema.parse(aggregate)
    .map((skill) => ({
      ...skill,
      earnedAt: Instant.fromEpochMilliseconds(Date.parse(skill.earnedAt)),
    }))
    .sort(byEarnedAt)

const storedBuildings: Readonly<Record<BuildingKind, StoredTownBuilding>> = {
  homes: 'homes',
  farm: 'farm',
  factory: 'factory',
  powerStation: 'power_station',
  storage: 'storage',
  school: 'school',
  office: 'office',
}

const buildingKindOf: Readonly<Record<StoredTownBuilding, BuildingKind>> = {
  homes: 'homes',
  farm: 'farm',
  factory: 'factory',
  power_station: 'powerStation',
  storage: 'storage',
  school: 'school',
  office: 'office',
}

const instantOf = (date: Date | null): Instant | null =>
  date === null ? null : Instant.fromEpochMilliseconds(date.getTime())

const dateOf = (instant: Instant | null): Date | null =>
  instant === null ? null : new Date(instant.epochMilliseconds)

const levelsOf = (aggregate: unknown): BuildingLevels => {
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

const stocksOf = (money: number, food: number, power: number, material: number): Stocks => ({
  money,
  food,
  power,
  material,
})

const waitingListOf = (aggregate: unknown): WaitingList =>
  AggregatedWaitingWorkSchema.parse(aggregate).map((work) => ({
    building: buildingKindOf[work.building],
    level: work.level,
    cost: stocksOf(work.costMoney, work.costFood, work.costPower, work.costMaterial),
    durationSeconds: work.durationSeconds,
  }))

const workSlotOf = (row: TownRow): WorkSlot => {
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
    cost: stocksOf(workCostMoney, workCostFood, workCostPower, workCostMaterial),
    startedAt: Instant.fromEpochMilliseconds(workStartedAt.getTime()),
    finishesAt: Instant.fromEpochMilliseconds(workFinishesAt.getTime()),
  }
}

type WorkSlotColumns = Pick<
  TownRow,
  | 'workBuilding'
  | 'workLevel'
  | 'workStartedAt'
  | 'workFinishesAt'
  | 'workCostMoney'
  | 'workCostFood'
  | 'workCostPower'
  | 'workCostMaterial'
>

const workSlotColumnsOf = (slot: WorkSlot): WorkSlotColumns => {
  if (slot.kind === 'idle') {
    return {
      workBuilding: null,
      workLevel: null,
      workStartedAt: null,
      workFinishesAt: null,
      workCostMoney: null,
      workCostFood: null,
      workCostPower: null,
      workCostMaterial: null,
    }
  }
  return {
    workBuilding: storedBuildings[slot.building],
    workLevel: slot.level,
    workStartedAt: new Date(slot.startedAt.epochMilliseconds),
    workFinishesAt: new Date(slot.finishesAt.epochMilliseconds),
    workCostMoney: slot.cost.money,
    workCostFood: slot.cost.food,
    workCostPower: slot.cost.power,
    workCostMaterial: slot.cost.material,
  }
}

const waitingRowsOf = (town: Town): ReadonlyArray<WaitingRow> =>
  town.waitingList.map((work, position) => ({
    townId: town.id,
    position,
    building: storedBuildings[work.building],
    level: work.level,
    costMoney: work.cost.money,
    costFood: work.cost.food,
    costPower: work.cost.power,
    costMaterial: work.cost.material,
    durationSeconds: work.durationSeconds,
  }))

const fullSinceOf = (row: TownRow): FullSince => ({
  money: instantOf(row.fullSinceMoney),
  food: instantOf(row.fullSinceFood),
  power: instantOf(row.fullSincePower),
  material: instantOf(row.fullSinceMaterial),
})

type ReadRow = {
  readonly town: TownRow
  readonly levels: unknown
  readonly waitingWork: unknown
  readonly skills: unknown
}

const townFrom = ({
  town: row,
  levels,
  waitingWork,
  skills,
}: ReadRow): Result<Town, DomainError> => {
  const name = TownName.create(row.name)
  if (!name.ok) {
    return name
  }
  const address = TownAddress.create(row.region, row.area, row.site)
  if (!address.ok) {
    return address
  }
  return Town.restore({
    id: row.id,
    playerId: row.playerId,
    name: name.value,
    address: address.value,
    stocks: { money: row.money, food: row.food, power: row.power, material: row.material },
    storedAt: Instant.fromEpochMilliseconds(row.storedAt.getTime()),
    fullSince: fullSinceOf(row),
    buildingLevels: levelsOf(levels),
    workSlot: workSlotOf(row),
    waitingList: waitingListOf(waitingWork),
    skills: skillsOf(skills),
  })
}

const rowOf = (town: Town): TownRow => ({
  id: town.id,
  playerId: town.playerId,
  region: town.address.region,
  area: town.address.area,
  site: town.address.site,
  name: town.name.value,
  money: town.stocks.money,
  food: town.stocks.food,
  power: town.stocks.power,
  material: town.stocks.material,
  storedAt: new Date(town.storedAt.epochMilliseconds),
  fullSinceMoney: dateOf(town.fullSince.money),
  fullSinceFood: dateOf(town.fullSince.food),
  fullSincePower: dateOf(town.fullSince.power),
  fullSinceMaterial: dateOf(town.fullSince.material),
  ...workSlotColumnsOf(town.workSlot),
})

const siteOf = ({ address: { region, area, site } }: Town): SiteAddress => ({ region, area, site })

export class DrizzleTownRepository implements TownReader, TownRepository {
  constructor(
    private readonly database: PostgresSession,
    private readonly read: TownRead,
  ) {}

  async holdsTown(playerId: PlayerId): Promise<boolean> {
    const held = await this.database
      .select({ id: towns.id })
      .from(towns)
      .where(eq(towns.playerId, playerId))
    return held.length > 0
  }

  async occupiedSites(): Promise<ReadonlyArray<SiteAddress>> {
    return this.database
      .select({ region: towns.region, area: towns.area, site: towns.site })
      .from(towns)
  }

  async townOf(playerId: PlayerId): Promise<Result<Town | undefined, DomainError>> {
    const query = this.database
      .select({
        town: towns,
        levels: aggregatedLevels,
        waitingWork: aggregatedWaitingWork,
        skills: aggregatedSkills,
      })
      .from(towns)
      .where(eq(towns.playerId, playerId))
    const rows = await (this.read === 'lockedForUpdate'
      ? query.for('update', { of: towns })
      : query)
    const first = rows[0]
    if (first === undefined) {
      return ok(undefined)
    }
    return townFrom(first)
  }

  async townWithSchoolOf(
    playerId: PlayerId,
  ): Promise<Result<TownWithSchool | undefined, DomainError>> {
    const [row] = await this.database
      .select({
        town: towns,
        levels: aggregatedLevels,
        waitingWork: aggregatedWaitingWork,
        skills: aggregatedSkills,
        lessonSlot: townLessonSlots,
        cards: aggregatedCardsOf(towns.playerId),
      })
      .from(towns)
      .leftJoin(townLessonSlots, eq(townLessonSlots.townId, towns.id))
      .where(eq(towns.playerId, playerId))
    if (row === undefined) {
      return ok(undefined)
    }
    const town = townFrom(row)
    if (!town.ok) {
      return town
    }
    const cards = heldCardsOf(row.cards, playerId)
    if (!cards.ok) {
      return cards
    }
    return ok({ town: town.value, lessonSlot: lessonSlotOf(row.lessonSlot), cards: cards.value })
  }

  async save(town: Town): Promise<Result<void, DomainError>> {
    const { id, ...changes } = rowOf(town)
    try {
      await this.database.transaction(async (transaction) => {
        await transaction
          .insert(towns)
          .values({ id, ...changes })
          .onConflictDoUpdate({ target: towns.id, set: changes })
        for (const building of buildingKinds) {
          const level = town.buildingLevels[building]
          await transaction
            .insert(townBuildings)
            .values({ townId: id, building: storedBuildings[building], level })
            .onConflictDoUpdate({
              target: [townBuildings.townId, townBuildings.building],
              set: { level },
            })
        }
        await transaction.delete(townWaitingWork).where(eq(townWaitingWork.townId, id))
        const waitingRows = waitingRowsOf(town)
        if (waitingRows.length > 0) {
          await transaction.insert(townWaitingWork).values([...waitingRows])
        }
      })
      return ok(undefined)
    } catch (failure) {
      const constraint = violatedUniqueConstraint(failure)
      if (constraint === 'towns_site_unique') {
        return err({ kind: 'SiteTaken', site: siteOf(town) })
      }
      if (constraint === 'towns_player_unique') {
        return err({ kind: 'PlayerAlreadyHoldsTown', playerId: town.playerId })
      }
      throw failure
    }
  }
}
