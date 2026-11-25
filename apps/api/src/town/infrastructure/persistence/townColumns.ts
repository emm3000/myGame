import type { BuildingKind, HiringSlot, Instant, JobSlot, Town, WorkSlot } from '@mygame/domain'
import type { townHiringOrders } from './hiringTables'
import type { townJobs } from './jobsTables'
import type { TownRow, townBuilding, townWaitingWork } from './townTables'

type StoredTownBuilding = (typeof townBuilding.enumValues)[number]

type SavedTownRow = Omit<TownRow, 'guidanceDismissedAt' | 'seenAt'>

type WaitingRow = typeof townWaitingWork.$inferSelect

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

type HiringOrderColumns = Omit<typeof townHiringOrders.$inferInsert, 'townId'>

type JobColumns = Omit<typeof townJobs.$inferInsert, 'townId'>

export const storedBuildings: Readonly<Record<BuildingKind, StoredTownBuilding>> = {
  homes: 'homes',
  farm: 'farm',
  factory: 'factory',
  powerStation: 'power_station',
  storage: 'storage',
  school: 'school',
  office: 'office',
}

const dateOf = (instant: Instant | null): Date | null =>
  instant === null ? null : new Date(instant.epochMilliseconds)

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

export const townColumns = (town: Town): SavedTownRow => ({
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

export const waitingWorkColumns = (town: Town): ReadonlyArray<WaitingRow> =>
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

export const hiringOrderColumns = (slot: HiringSlot): HiringOrderColumns | undefined =>
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

export const jobColumns = (slot: JobSlot): JobColumns | undefined =>
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
