import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import { err, ok, type Result } from '../Result'
import { Duration } from '../time/Duration'
import type { Instant } from '../time/Instant'
import type { BuildingLevels } from './BuildingLevels'
import { foundingLevels } from './BuildingLevels'
import {
  type BusyWorkSlot,
  idleWorkSlot,
  type WaitingList,
  type WaitingWork,
  type WorkSlot,
  type WorkTarget,
} from './BuildingWork'
import { buildingKinds } from './buildingKinds'
import { deliveredHiresOf } from './deliveredHiresOf'
import { type FullSince, noStoreFull } from './FullSince'
import type { HireKind } from './HireKind'
import { type Hires, noHires } from './Hires'
import { type HiringOrder, type HiringSlot, type HiringTarget, idleHiringSlot } from './HiringOrder'
import { hireKinds } from './hireKinds'
import { hiringEndsAt } from './hiringEndsAt'
import type { ResourceKind } from './ResourceKind'
import { recheckWaitingList } from './recheckWaitingList'
import { resourceKinds } from './resourceKinds'
import type { Stocks } from './Stocks'
import type { Terrain } from './Terrain'
import type { TownAddress } from './TownAddress'
import type { TownCatalog } from './TownCatalog'
import type { TownEvent } from './TownEvent'
import type { TownId } from './TownId'
import type { TownName } from './TownName'
import type { TownSkill } from './TownSkill'
import { terrainOf } from './terrainOf'

export type TownFounding = {
  readonly id: TownId
  readonly playerId: PlayerId
  readonly name: TownName
  readonly address: TownAddress
  readonly startingStocks: Stocks
  readonly skills: ReadonlyArray<TownSkill>
  readonly at: Instant
}

type TownState = {
  readonly stocks: Stocks
  readonly storedAt: Instant
  readonly fullSince: FullSince
  readonly buildingLevels: BuildingLevels
  readonly workSlot: WorkSlot
  readonly waitingList: WaitingList
  readonly skills: ReadonlyArray<TownSkill>
  readonly hires: Hires
  readonly hiringSlot: HiringSlot
}

export type StoredTown = TownState & {
  readonly id: TownId
  readonly playerId: PlayerId
  readonly name: TownName
  readonly address: TownAddress
}

export type ChangedTown = {
  readonly town: Town
  readonly events: ReadonlyArray<TownEvent>
}

const isWholeFromZero = (value: number): boolean => Number.isInteger(value) && value >= 0

const stocksOf = (amountOf: (resource: ResourceKind) => number): Stocks => ({
  money: amountOf('money'),
  food: amountOf('food'),
  power: amountOf('power'),
  material: amountOf('material'),
})

const credited = (stocks: Stocks, amounts: Stocks): Stocks =>
  stocksOf((resource) => stocks[resource] + amounts[resource])

const debited = (stocks: Stocks, amounts: Stocks): Stocks =>
  stocksOf((resource) => stocks[resource] - amounts[resource])

const shortfallOf = (stocks: Stocks, cost: Stocks): Stocks =>
  stocksOf((resource) => Math.max(0, cost[resource] - stocks[resource]))

const isShort = (missing: Stocks): boolean =>
  resourceKinds.some((resource) => missing[resource] > 0)

type PaidWork = WorkTarget & { readonly cost: Stocks }

const refundOf = (stopped: ReadonlyArray<PaidWork>): Stocks =>
  stopped.reduce(
    (refund, work) => credited(refund, work.cost),
    stocksOf(() => 0),
  )

const refuseInvalidStocks = (stocks: Stocks): DomainError | undefined => {
  const invalid = resourceKinds.find((resource) => !isWholeFromZero(stocks[resource]))
  return invalid === undefined
    ? undefined
    : { kind: 'InvalidTownStock', resource: invalid, amount: stocks[invalid] }
}

const refuseInvalidLevels = (levels: BuildingLevels): DomainError | undefined => {
  const invalid = buildingKinds.find((building) => !isWholeFromZero(levels[building]))
  return invalid === undefined
    ? undefined
    : { kind: 'InvalidTownBuildingLevel', building: invalid, level: levels[invalid] }
}

const refuseInvalidCost = (cost: Stocks): DomainError | undefined => {
  const negative = resourceKinds.find((resource) => cost[resource] < 0)
  if (negative !== undefined) {
    return { kind: 'NegativeResourceAmount', amount: cost[negative] }
  }
  const fractional = resourceKinds.find((resource) => !Number.isInteger(cost[resource]))
  return fractional === undefined
    ? undefined
    : { kind: 'FractionalResourceAmount', amount: cost[fractional] }
}

const refuseInvalidWork = (work: PaidWork): DomainError | undefined => {
  if (!Number.isInteger(work.level) || work.level < 1) {
    return { kind: 'InvalidTownBuildingLevel', building: work.building, level: work.level }
  }
  return refuseInvalidCost(work.cost)
}

const refuseInvalidDuration = (seconds: number): DomainError | undefined => {
  if (seconds < 0) {
    return { kind: 'NegativeDuration', seconds }
  }
  return Number.isInteger(seconds) ? undefined : { kind: 'FractionalDuration', seconds }
}

const refuseInvalidSlot = (slot: WorkSlot, storedAt: Instant): DomainError | undefined => {
  if (slot.kind === 'idle') {
    return undefined
  }
  const { startedAt, finishesAt } = slot
  if (startedAt.epochMilliseconds > finishesAt.epochMilliseconds) {
    return { kind: 'SlotStartsAfterFinish', startedAt, finishesAt }
  }
  if (finishesAt.epochMilliseconds < storedAt.epochMilliseconds) {
    return { kind: 'SlotFinishesBeforeStored', storedAt, finishesAt }
  }
  return refuseInvalidWork(slot)
}

const refuseInvalidWaitingList = (waitingList: WaitingList): DomainError | undefined => {
  for (const work of waitingList) {
    const refusal = refuseInvalidWork(work) ?? refuseInvalidDuration(work.durationSeconds)
    if (refusal !== undefined) {
      return refusal
    }
  }
  return undefined
}

const isWholeFromOne = (value: number): boolean => Number.isInteger(value) && value >= 1

const refuseInvalidHires = (hires: Hires): DomainError | undefined => {
  const invalid = hireKinds.find((hire) => !isWholeFromZero(hires[hire]))
  return invalid === undefined
    ? undefined
    : { kind: 'InvalidHireCount', hire: invalid, count: hires[invalid] }
}

const refuseInvalidHiring = (slot: HiringSlot): DomainError | undefined => {
  if (slot.kind === 'idle') {
    return undefined
  }
  const { hire, count, secondsPerHire } = slot
  if (!isWholeFromOne(count)) {
    return { kind: 'InvalidHireCount', hire, count }
  }
  if (!isWholeFromOne(secondsPerHire)) {
    return { kind: 'InvalidHireDuration', hire, secondsPerHire }
  }
  return refuseInvalidCost(slot.costPerHire)
}

const refuseInvalidTown = (stored: StoredTown): DomainError | undefined =>
  refuseInvalidStocks(stored.stocks) ??
  refuseInvalidLevels(stored.buildingLevels) ??
  refuseInvalidSlot(stored.workSlot, stored.storedAt) ??
  refuseInvalidWaitingList(stored.waitingList) ??
  refuseInvalidHires(stored.hires) ??
  refuseInvalidHiring(stored.hiringSlot)

const timesCount = (amounts: Stocks, count: number): Stocks =>
  stocksOf((resource) => amounts[resource] * count)

const hiresPlus = (hires: Hires, hire: HireKind, count: number): Hires => ({
  ...hires,
  [hire]: hires[hire] + count,
})

const isHiringOf = (target: HiringTarget, order: HiringOrder): boolean =>
  order.hire === target.hire &&
  order.startedAt.epochMilliseconds === target.startedAt.epochMilliseconds

const busySlotOf = (work: WaitingWork, startedAt: Instant): Result<BusyWorkSlot, DomainError> => {
  const duration = Duration.ofSeconds(work.durationSeconds)
  if (!duration.ok) {
    return duration
  }
  const { building, level, cost } = work
  return ok({
    kind: 'busy',
    building,
    level,
    cost,
    startedAt,
    finishesAt: startedAt.plus(duration.value),
  })
}

const resumedWork = (
  workSlot: WorkSlot,
  kept: WaitingList,
  now: Instant,
): Result<Pick<TownState, 'workSlot' | 'waitingList'>, DomainError> => {
  const [next, ...waitingList] = kept
  if (workSlot.kind === 'busy' || next === undefined) {
    return ok({ workSlot, waitingList: kept })
  }
  const slot = busySlotOf(next, now)
  if (!slot.ok) {
    return slot
  }
  return ok({ workSlot: slot.value, waitingList })
}

const isWorkOf = (target: WorkTarget, work: WorkTarget): boolean =>
  work.building === target.building && work.level === target.level

const workStoppedAt = (work: PaidWork, at: Instant): TownEvent => ({
  kind: 'buildingWorkStopped',
  building: work.building,
  level: work.level,
  refund: work.cost,
  occurredAt: at,
})

export class Town {
  private constructor(
    readonly id: TownId,
    readonly playerId: PlayerId,
    readonly name: TownName,
    readonly address: TownAddress,
    private readonly state: TownState,
  ) {}

  static found({ id, playerId, name, address, startingStocks, skills, at }: TownFounding): Town {
    return new Town(id, playerId, name, address, {
      stocks: startingStocks,
      storedAt: at,
      fullSince: noStoreFull,
      buildingLevels: foundingLevels,
      workSlot: idleWorkSlot,
      waitingList: [],
      skills,
      hires: noHires,
      hiringSlot: idleHiringSlot,
    })
  }

  static restore(stored: StoredTown): Result<Town, DomainError> {
    const refusal = refuseInvalidTown(stored)
    if (refusal !== undefined) {
      return err(refusal)
    }
    const { id, playerId, name, address, ...state } = stored
    return ok(new Town(id, playerId, name, address, state))
  }

  get stocks(): Stocks {
    return this.state.stocks
  }

  get storedAt(): Instant {
    return this.state.storedAt
  }

  get fullSince(): FullSince {
    return this.state.fullSince
  }

  get buildingLevels(): BuildingLevels {
    return this.state.buildingLevels
  }

  get workSlot(): WorkSlot {
    return this.state.workSlot
  }

  get waitingList(): WaitingList {
    return this.state.waitingList
  }

  get skills(): ReadonlyArray<TownSkill> {
    return this.state.skills
  }

  get hires(): Hires {
    return this.state.hires
  }

  get hiringSlot(): HiringSlot {
    return this.state.hiringSlot
  }

  get staffedHires(): Hires {
    const slot = this.hiringSlot
    return slot.kind === 'busy' ? hiresPlus(this.hires, slot.hire, slot.count) : this.hires
  }

  hiresAt(at: Instant): Hires {
    const slot = this.hiringSlot
    return slot.kind === 'busy'
      ? hiresPlus(this.hires, slot.hire, deliveredHiresOf(slot, at))
      : this.hires
  }

  roomForHiring(): Result<void, DomainError> {
    const slot = this.hiringSlot
    return slot.kind === 'busy' ? err({ kind: 'HiringSlotBusy', hire: slot.hire }) : ok(undefined)
  }

  placeHiring(order: HiringOrder, stocksAtNow: Stocks, now: Instant): Result<Town, DomainError> {
    const room = this.roomForHiring()
    if (!room.ok) {
      return room
    }
    const cost = timesCount(order.costPerHire, order.count)
    const missing = shortfallOf(stocksAtNow, cost)
    if (isShort(missing)) {
      return err({ kind: 'NotEnoughResources', missing })
    }
    return ok(
      this.changed({ stocks: debited(stocksAtNow, cost), storedAt: now, hiringSlot: order }),
    )
  }

  stopHiring(
    target: HiringTarget,
    stocksAtNow: Stocks,
    now: Instant,
  ): Result<ChangedTown, DomainError> {
    const slot = this.hiringSlot
    if (slot.kind === 'idle' || !isHiringOf(target, slot)) {
      return err({ kind: 'HiringOrderNotFound', hire: target.hire, startedAt: target.startedAt })
    }
    const delivered = deliveredHiresOf(slot, now)
    const stopped = slot.count - delivered
    const refund = timesCount(slot.costPerHire, stopped)
    return ok({
      town: this.changed({
        stocks: credited(stocksAtNow, refund),
        storedAt: now,
        hires: hiresPlus(this.hires, slot.hire, delivered),
        hiringSlot: idleHiringSlot,
      }),
      events: [
        { kind: 'hiringStopped', hire: slot.hire, delivered, stopped, refund, occurredAt: now },
      ],
    })
  }

  closeHiring(now: Instant): ChangedTown {
    const slot = this.hiringSlot
    if (slot.kind === 'idle') {
      return { town: this, events: [] }
    }
    const endsAt = hiringEndsAt(slot)
    if (endsAt.epochMilliseconds > now.epochMilliseconds) {
      return { town: this, events: [] }
    }
    return {
      town: this.changed({
        hires: hiresPlus(this.hires, slot.hire, slot.count),
        hiringSlot: idleHiringSlot,
      }),
      events: [{ kind: 'hiringDelivered', hire: slot.hire, count: slot.count, occurredAt: endsAt }],
    }
  }

  get terrain(): Terrain {
    return terrainOf(this.address.area)
  }

  get projectedLevels(): BuildingLevels {
    const projected = { ...this.buildingLevels }
    const slot = this.workSlot
    const planned = slot.kind === 'busy' ? [slot, ...this.waitingList] : this.waitingList
    for (const { building, level } of planned) {
      projected[building] = level
    }
    return projected
  }

  roomForWork(waitingListCap: number): Result<void, DomainError> {
    if (this.workSlot.kind === 'busy' && this.waitingList.length >= waitingListCap) {
      return err({ kind: 'WaitingListFull', cap: waitingListCap })
    }
    return ok(undefined)
  }

  startWork(
    work: WaitingWork,
    stocksAtNow: Stocks,
    now: Instant,
    waitingListCap: number,
  ): Result<Town, DomainError> {
    const room = this.roomForWork(waitingListCap)
    if (!room.ok) {
      return room
    }
    const missing = shortfallOf(stocksAtNow, work.cost)
    if (isShort(missing)) {
      return err({ kind: 'NotEnoughResources', missing })
    }
    const stocks = debited(stocksAtNow, work.cost)
    if (this.workSlot.kind === 'busy') {
      return ok(this.changed({ stocks, storedAt: now, waitingList: [...this.waitingList, work] }))
    }
    const slot = busySlotOf(work, now)
    if (!slot.ok) {
      return slot
    }
    return ok(this.changed({ stocks, storedAt: now, workSlot: slot.value }))
  }

  stopWork(
    target: WorkTarget,
    stocksAtNow: Stocks,
    now: Instant,
    catalog: TownCatalog,
  ): Result<ChangedTown, DomainError> {
    const slot = this.workSlot
    if (slot.kind === 'busy' && isWorkOf(target, slot)) {
      return this.stoppedWith(slot, idleWorkSlot, this.waitingList, stocksAtNow, now, catalog)
    }
    const position = this.waitingList.findIndex((work) => isWorkOf(target, work))
    const stoppedWork = this.waitingList[position]
    if (slot.kind === 'idle' || stoppedWork === undefined) {
      return err({ kind: 'BuildingWorkNotFound', building: target.building, level: target.level })
    }
    const rest = this.waitingList.filter((_, index) => index !== position)
    return this.stoppedWith(stoppedWork, slot, rest, stocksAtNow, now, catalog)
  }

  completeWork(stocksAtFinish: Stocks): Result<Town, DomainError> {
    const finished = this.workSlot
    if (finished.kind === 'idle') {
      return ok(this)
    }
    const buildingLevels = { ...this.buildingLevels, [finished.building]: finished.level }
    const [next, ...waitingList] = this.waitingList
    if (next === undefined) {
      return ok(
        this.changed({
          stocks: stocksAtFinish,
          storedAt: finished.finishesAt,
          buildingLevels,
          workSlot: idleWorkSlot,
        }),
      )
    }
    const slot = busySlotOf(next, finished.finishesAt)
    if (!slot.ok) {
      return slot
    }
    return ok(
      this.changed({
        stocks: stocksAtFinish,
        storedAt: finished.finishesAt,
        buildingLevels,
        workSlot: slot.value,
        waitingList,
      }),
    )
  }

  earnSkill(skill: TownSkill, stocksAtEarn: Stocks): Town {
    return this.changed({
      skills: [...this.skills, skill],
      stocks: stocksAtEarn,
      storedAt: skill.earnedAt,
    })
  }

  withFullSince(fullSince: FullSince): Town {
    return this.changed({ fullSince })
  }

  private stoppedWith(
    stoppedWork: PaidWork,
    workSlot: WorkSlot,
    rest: WaitingList,
    stocksAtNow: Stocks,
    now: Instant,
    catalog: TownCatalog,
  ): Result<ChangedTown, DomainError> {
    const rechecked = recheckWaitingList(
      this.buildingLevels,
      workSlot,
      rest,
      this.staffedHires,
      catalog,
    )
    if (!rechecked.ok) {
      return rechecked
    }
    const resumed = resumedWork(workSlot, rechecked.value.kept, now)
    if (!resumed.ok) {
      return resumed
    }
    const stopped = [stoppedWork, ...rechecked.value.stopped]
    return ok({
      town: this.changed({
        stocks: credited(stocksAtNow, refundOf(stopped)),
        storedAt: now,
        ...resumed.value,
      }),
      events: stopped.map((work) => workStoppedAt(work, now)),
    })
  }

  private changed(change: Partial<TownState>): Town {
    return new Town(this.id, this.playerId, this.name, this.address, { ...this.state, ...change })
  }
}
