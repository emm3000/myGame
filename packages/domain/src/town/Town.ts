import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import { err, ok, type Result } from '../Result'
import { Duration } from '../time/Duration'
import type { Instant } from '../time/Instant'
import type { BuildingLevels } from './building/BuildingLevels'
import { foundingLevels } from './building/BuildingLevels'
import {
  type BusyWorkSlot,
  idleWorkSlot,
  type PaidWork,
  type WorkSlot,
  type WorkTarget,
} from './building/BuildingWork'
import { recheckWaitingList } from './building/recheckWaitingList'
import type { WaitingList, WaitingWork } from './building/WaitingList'
import { type FullSince, noStoreFull } from './FullSince'
import { deliveredHiresOf } from './hiring/deliveredHiresOf'
import type { HireKind } from './hiring/HireKind'
import { type Hires, hiresPlus, noHires } from './hiring/Hires'
import {
  type HiringOrder,
  type HiringSlot,
  type HiringTarget,
  idleHiringSlot,
} from './hiring/HiringOrder'
import { hireKinds } from './hiring/hireKinds'
import { hiringEndsAt } from './hiring/hiringEndsAt'
import { coversWaste } from './jobs/coversWaste'
import { idleJobSlot, type Job, type JobCleanUp, type JobSlot } from './jobs/Job'
import { jobInstantsOf } from './jobs/jobInstantsOf'
import { jobPayOfMilliseconds } from './jobs/jobPayOfMilliseconds'
import { jobPhaseAt } from './jobs/jobPhaseAt'
import type { Terrain } from './jobs/Terrain'
import { terrainOf } from './jobs/terrainOf'
import type { TownCatalog } from './ports/TownCatalog'
import { refuseInvalidTown } from './refuseInvalidTown'
import { chargedStocks, creditedStocks, type Stocks, stocksOf } from './Stocks'
import type { TownAddress } from './TownAddress'
import type { TownEvent } from './TownEvent'
import type { TownId } from './TownId'
import type { TownName } from './TownName'
import type { TownSkill } from './TownSkill'

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
  readonly jobSlot: JobSlot
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

const refundOf = (stopped: ReadonlyArray<PaidWork>): Stocks =>
  stopped.reduce(
    (refund, work) => creditedStocks(refund, work.cost),
    stocksOf(() => 0),
  )

const timesCount = (amounts: Stocks, count: number): Stocks =>
  stocksOf((resource) => amounts[resource] * count)

const hiresOf = (countOf: (hire: HireKind) => number): Hires => ({
  worker: countOf('worker'),
  truck: countOf('truck'),
})

const jobReturnOf = (job: Job, occurredAt: Instant): TownEvent => ({
  kind: job.calledBackAt === undefined ? 'jobBack' : 'jobCalledBack',
  site: job.site,
  pay: job.pay,
  occurredAt,
})

const arrivalOf = ({ site, pay }: Job, cleanUp: JobCleanUp, occurredAt: Instant): TownEvent =>
  coversWaste(cleanUp)
    ? { kind: 'cleanUpDone', site, reward: pay, occurredAt }
    : { kind: 'cleanUpFailed', site, occurredAt }

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
      jobSlot: idleJobSlot,
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

  get jobSlot(): JobSlot {
    return this.state.jobSlot
  }

  hiresAtHomeAt(at: Instant): Hires {
    const atHand = this.hiresAt(at)
    const slot = this.jobSlot
    return slot.kind === 'idle' ? atHand : hiresOf((hire) => atHand[hire] - slot.team[hire])
  }

  roomForJob(): Result<void, DomainError> {
    return this.jobSlot.kind === 'out' ? err({ kind: 'TeamAlreadyOut' }) : ok(undefined)
  }

  sendJob(job: Job): Result<Town, DomainError> {
    const room = this.roomForJob()
    if (!room.ok) {
      return room
    }
    const atHome = this.hiresAtHomeAt(job.sentAt)
    const short = hireKinds.find((hire) => job.team[hire] > atHome[hire])
    if (short !== undefined) {
      return err({
        kind: 'NotEnoughHiresAtHome',
        hire: short,
        count: job.team[short],
        atHome: atHome[short],
      })
    }
    return ok(this.changed({ jobSlot: job }))
  }

  callJobBack(sentAt: Instant, now: Instant, catalog: TownCatalog): Result<Town, DomainError> {
    const slot = this.jobSlot
    if (slot.kind === 'idle' || slot.sentAt.epochMilliseconds !== sentAt.epochMilliseconds) {
      return err({ kind: 'JobNotFound', sentAt })
    }
    if (jobPhaseAt(slot, now) === 'returning') {
      return err({ kind: 'JobAlreadyReturning' })
    }
    const workedMilliseconds = Math.max(
      0,
      now.epochMilliseconds - jobInstantsOf(slot).arrivesAt.epochMilliseconds,
    )
    const pay = jobPayOfMilliseconds(
      terrainOf(slot.site.area),
      slot.team,
      workedMilliseconds,
      catalog,
      slot.payPercent,
    )
    return ok(this.changed({ jobSlot: { ...slot, calledBackAt: now, pay } }))
  }

  arriveAtWaste(): ChangedTown {
    const slot = this.jobSlot
    if (slot.kind === 'idle' || slot.cleanUp === undefined || slot.cleanUp.hasArrived) {
      return { town: this, events: [] }
    }
    return {
      town: this.changed({ jobSlot: { ...slot, cleanUp: { ...slot.cleanUp, hasArrived: true } } }),
      events: [arrivalOf(slot, slot.cleanUp, jobInstantsOf(slot).arrivesAt)],
    }
  }

  returnJob(stocksAtReturn: Stocks): ChangedTown {
    const slot = this.jobSlot
    if (slot.kind === 'idle') {
      return { town: this, events: [] }
    }
    const { returnsAt } = jobInstantsOf(slot)
    return {
      town: this.changed({
        stocks: creditedStocks(stocksAtReturn, slot.pay),
        storedAt: returnsAt,
        jobSlot: idleJobSlot,
      }),
      events: [jobReturnOf(slot, returnsAt)],
    }
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
    const charged = chargedStocks(stocksAtNow, timesCount(order.costPerHire, order.count))
    if (!charged.ok) {
      return charged
    }
    return ok(this.changed({ stocks: charged.value, storedAt: now, hiringSlot: order }))
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
        stocks: creditedStocks(stocksAtNow, refund),
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
    const charged = chargedStocks(stocksAtNow, work.cost)
    if (!charged.ok) {
      return charged
    }
    const stocks = charged.value
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
        stocks: creditedStocks(stocksAtNow, refundOf(stopped)),
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
