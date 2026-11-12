import {
  type BuildingKind,
  type BuildingLevels,
  buildingKinds,
  type DomainError,
  err,
  type FullSince,
  type Hires,
  type HiringSlot,
  hireKinds,
  Instant,
  idleHiringSlot,
  idleJobSlot,
  idleWorkSlot,
  type Job,
  type JobCleanUp,
  type JobSlot,
  ok,
  type PlayerId,
  type Result,
  type SiteAddress,
  type Stocks,
  Town,
  TownAddress,
  TownName,
  type TownRepository,
  type TownSkill,
  type WaitingList,
  type WorkSlot,
} from '@mygame/domain'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { TownReader, TownWithSchool } from '../../town/TownReader'
import { byEarnedAt } from '../byEarnedAt'
import { aggregatedCardsOf, heldCardsOf } from './aggregatedCards'
import { aggregatedHeldOutWordsOf, heldOutHeadwordsOf } from './aggregatedHeldOutWords'
import { aggregatedSeenTipsOf, seenTipsFrom } from './aggregatedSeenTips'
import type { PostgresSession } from './connectPostgres'
import { jsonAggregateOf } from './jsonAggregateOf'
import { lessonSlotOf } from './lessonSlotOf'
import {
  earnedSkills,
  townBuilding,
  townBuildings,
  townHire,
  townHires,
  townHiringOrders,
  townJobs,
  townLessonSlots,
  townResource,
  towns,
  townWaitingWork,
} from './schema'
import { violatedUniqueConstraint } from './violatedUniqueConstraint'

export type TownRead = 'lockedForUpdate' | 'lockFree'

type StoredTownBuilding = (typeof townBuilding.enumValues)[number]

type TownRow = typeof towns.$inferSelect

type SavedTownRow = Omit<TownRow, 'guidanceDismissedAt'>

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

const AggregatedHiresSchema = z.array(
  z.strictObject({ hire: z.enum(townHire.enumValues), count: z.number().int() }),
)

const aggregatedHires = jsonAggregateOf(
  townHires,
  { hire: townHires.hire, count: townHires.count },
  eq(townHires.townId, towns.id),
  sql`${townHires.hire}`,
)

const AggregatedHiringOrdersSchema = z
  .array(
    z.strictObject({
      hire: z.enum(townHire.enumValues),
      count: z.number().int(),
      costMoney: z.number(),
      costFood: z.number(),
      costPower: z.number(),
      costMaterial: z.number(),
      secondsPerHire: z.number().int(),
      startedAt: z.string(),
    }),
  )
  .max(1)

const aggregatedHiringOrder = jsonAggregateOf(
  townHiringOrders,
  {
    hire: townHiringOrders.hire,
    count: townHiringOrders.count,
    costMoney: townHiringOrders.costMoney,
    costFood: townHiringOrders.costFood,
    costPower: townHiringOrders.costPower,
    costMaterial: townHiringOrders.costMaterial,
    secondsPerHire: townHiringOrders.secondsPerHire,
    startedAt: townHiringOrders.startedAt,
  },
  eq(townHiringOrders.townId, towns.id),
  sql`${townHiringOrders.townId}`,
)

const AggregatedJobsSchema = z
  .array(
    z.strictObject({
      region: z.number().int(),
      area: z.number().int(),
      site: z.number().int(),
      workerCount: z.number().int(),
      truckCount: z.number().int(),
      hours: z.number().int(),
      sentAt: z.string(),
      oneWaySeconds: z.number().int(),
      payMoney: z.number(),
      payFood: z.number(),
      payPower: z.number(),
      payMaterial: z.number(),
      payPercentMoney: z.number().int(),
      payPercentFood: z.number().int(),
      payPercentPower: z.number().int(),
      payPercentMaterial: z.number().int(),
      calledBackAt: z.string().nullable(),
      wasteSize: z.union([z.literal(1), z.literal(2), z.literal(3)]).nullable(),
      waste: z.number().int().nullable(),
      strength: z.number().int().nullable(),
      hasArrived: z.boolean(),
    }),
  )
  .max(1)

const aggregatedJob = jsonAggregateOf(
  townJobs,
  {
    region: townJobs.region,
    area: townJobs.area,
    site: townJobs.site,
    workerCount: townJobs.workerCount,
    truckCount: townJobs.truckCount,
    hours: townJobs.hours,
    sentAt: townJobs.sentAt,
    oneWaySeconds: townJobs.oneWaySeconds,
    payMoney: townJobs.payMoney,
    payFood: townJobs.payFood,
    payPower: townJobs.payPower,
    payMaterial: townJobs.payMaterial,
    payPercentMoney: townJobs.payPercentMoney,
    payPercentFood: townJobs.payPercentFood,
    payPercentPower: townJobs.payPercentPower,
    payPercentMaterial: townJobs.payPercentMaterial,
    calledBackAt: townJobs.calledBackAt,
    wasteSize: townJobs.wasteSize,
    waste: townJobs.waste,
    strength: townJobs.strength,
    hasArrived: townJobs.hasArrived,
  },
  eq(townJobs.townId, towns.id),
  sql`${townJobs.townId}`,
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

const hiresOf = (row: TownRow, aggregate: unknown): Hires => {
  const counts = new Map(
    AggregatedHiresSchema.parse(aggregate).map(({ hire, count }) => [hire, count]),
  )
  const worker = counts.get('worker')
  const truck = counts.get('truck')
  if (worker === undefined || truck === undefined) {
    throw new Error(`Town ${row.id} stores no count for every hire`)
  }
  return { worker, truck }
}

const hiringSlotOf = (aggregate: unknown): HiringSlot => {
  const [order] = AggregatedHiringOrdersSchema.parse(aggregate)
  if (order === undefined) {
    return idleHiringSlot
  }
  return {
    kind: 'busy',
    hire: order.hire,
    count: order.count,
    costPerHire: stocksOf(order.costMoney, order.costFood, order.costPower, order.costMaterial),
    secondsPerHire: order.secondsPerHire,
    startedAt: Instant.fromEpochMilliseconds(Date.parse(order.startedAt)),
  }
}

const instantFromIso = (iso: string): Instant => Instant.fromEpochMilliseconds(Date.parse(iso))

type AggregatedJob = z.infer<typeof AggregatedJobsSchema>[number]

const cleanUpOf = ({
  wasteSize,
  waste,
  strength,
  hasArrived,
}: AggregatedJob): { readonly cleanUp?: JobCleanUp } => {
  if (wasteSize === null && waste === null && strength === null) {
    return {}
  }
  if (wasteSize === null || waste === null || strength === null) {
    throw new Error('A stored job holds a half-written clean-up')
  }
  return { cleanUp: { size: wasteSize, waste, strength, hasArrived } }
}

const jobSlotOf = (aggregate: unknown): JobSlot => {
  const [job] = AggregatedJobsSchema.parse(aggregate)
  if (job === undefined) {
    return idleJobSlot
  }
  const sent: Job = {
    kind: 'out',
    site: { region: job.region, area: job.area, site: job.site },
    team: { worker: job.workerCount, truck: job.truckCount },
    hours: job.hours,
    sentAt: instantFromIso(job.sentAt),
    oneWaySeconds: job.oneWaySeconds,
    pay: stocksOf(job.payMoney, job.payFood, job.payPower, job.payMaterial),
    payPercent: {
      money: job.payPercentMoney,
      food: job.payPercentFood,
      power: job.payPercentPower,
      material: job.payPercentMaterial,
    },
  }
  const calledBack =
    job.calledBackAt === null ? sent : { ...sent, calledBackAt: instantFromIso(job.calledBackAt) }
  return { ...calledBack, ...cleanUpOf(job) }
}

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
  readonly hires: unknown
  readonly hiringOrder: unknown
  readonly job: unknown
  readonly skills: unknown
}

const townFrom = ({
  town: row,
  levels,
  waitingWork,
  hires,
  hiringOrder,
  job,
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
    hires: hiresOf(row, hires),
    hiringSlot: hiringSlotOf(hiringOrder),
    jobSlot: jobSlotOf(job),
    skills: skillsOf(skills),
  })
}

const rowOf = (town: Town): SavedTownRow => ({
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

type HiringOrderColumns = Omit<typeof townHiringOrders.$inferInsert, 'townId'>

const hiringOrderColumnsOf = (slot: HiringSlot): HiringOrderColumns | undefined =>
  slot.kind === 'idle'
    ? undefined
    : {
        hire: slot.hire,
        count: slot.count,
        costMoney: slot.costPerHire.money,
        costFood: slot.costPerHire.food,
        costPower: slot.costPerHire.power,
        costMaterial: slot.costPerHire.material,
        secondsPerHire: slot.secondsPerHire,
        startedAt: new Date(slot.startedAt.epochMilliseconds),
      }

const saveHiringSlot = async (
  database: PostgresSession,
  townId: string,
  slot: HiringSlot,
): Promise<void> => {
  const columns = hiringOrderColumnsOf(slot)
  if (columns === undefined) {
    await database.delete(townHiringOrders).where(eq(townHiringOrders.townId, townId))
    return
  }
  await database
    .insert(townHiringOrders)
    .values({ townId, ...columns })
    .onConflictDoUpdate({ target: townHiringOrders.townId, set: columns })
}

type JobColumns = Omit<typeof townJobs.$inferInsert, 'townId'>

const jobColumnsOf = (slot: JobSlot): JobColumns | undefined =>
  slot.kind === 'idle'
    ? undefined
    : {
        region: slot.site.region,
        area: slot.site.area,
        site: slot.site.site,
        workerCount: slot.team.worker,
        truckCount: slot.team.truck,
        hours: slot.hours,
        sentAt: new Date(slot.sentAt.epochMilliseconds),
        oneWaySeconds: slot.oneWaySeconds,
        payMoney: slot.pay.money,
        payFood: slot.pay.food,
        payPower: slot.pay.power,
        payMaterial: slot.pay.material,
        payPercentMoney: slot.payPercent.money,
        payPercentFood: slot.payPercent.food,
        payPercentPower: slot.payPercent.power,
        payPercentMaterial: slot.payPercent.material,
        calledBackAt:
          slot.calledBackAt === undefined ? null : new Date(slot.calledBackAt.epochMilliseconds),
        wasteSize: slot.cleanUp?.size ?? null,
        waste: slot.cleanUp?.waste ?? null,
        strength: slot.cleanUp?.strength ?? null,
        hasArrived: slot.cleanUp?.hasArrived ?? false,
      }

const saveJobSlot = async (
  database: PostgresSession,
  townId: string,
  slot: JobSlot,
): Promise<void> => {
  const columns = jobColumnsOf(slot)
  if (columns === undefined) {
    await database.delete(townJobs).where(eq(townJobs.townId, townId))
    return
  }
  await database
    .insert(townJobs)
    .values({ townId, ...columns })
    .onConflictDoUpdate({ target: townJobs.townId, set: columns })
}

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
        hires: aggregatedHires,
        hiringOrder: aggregatedHiringOrder,
        job: aggregatedJob,
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
        hires: aggregatedHires,
        hiringOrder: aggregatedHiringOrder,
        job: aggregatedJob,
        skills: aggregatedSkills,
        lessonSlot: townLessonSlots,
        cards: aggregatedCardsOf(towns.playerId),
        heldOutWords: aggregatedHeldOutWordsOf(towns.playerId),
        seenTips: aggregatedSeenTipsOf(towns.playerId),
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
    return ok({
      town: town.value,
      lessonSlot: lessonSlotOf(row.lessonSlot),
      cards: cards.value,
      heldOutWords: heldOutHeadwordsOf(row.heldOutWords),
      guidanceDismissedAt: instantOf(row.town.guidanceDismissedAt) ?? undefined,
      seenTips: seenTipsFrom(row.seenTips),
    })
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
        for (const hire of hireKinds) {
          const count = town.hires[hire]
          await transaction
            .insert(townHires)
            .values({ townId: id, hire, count })
            .onConflictDoUpdate({ target: [townHires.townId, townHires.hire], set: { count } })
        }
        await saveHiringSlot(transaction, id, town.hiringSlot)
        await saveJobSlot(transaction, id, town.jobSlot)
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
