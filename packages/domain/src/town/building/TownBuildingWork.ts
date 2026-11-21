import type { DomainError } from '../../DomainError'
import { err, ok, type Result } from '../../Result'
import { Duration } from '../../time/Duration'
import type { Instant } from '../../time/Instant'
import type { TownCatalog } from '../ports/TownCatalog'
import { chargedStocks } from '../chargedStocks'
import { creditedStocks, type Stocks, stocksOf } from '../Stocks'
import type { ChangedTown, Town, TownState } from '../Town'
import type { TownEvent } from '../TownEvent'
import {
  type BusyWorkSlot,
  idleWorkSlot,
  type PaidWork,
  type WorkSlot,
  type WorkTarget,
} from './BuildingWork'
import { recheckWaitingList } from './recheckWaitingList'
import type { WaitingList, WaitingWork } from './WaitingList'

const refundOf = (stopped: ReadonlyArray<PaidWork>): Stocks =>
  stopped.reduce(
    (refund, work) => creditedStocks(refund, work.cost),
    stocksOf(() => 0),
  )

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

export class TownBuildingWork {
  constructor(
    private readonly town: Town,
    private readonly changed: (town: Town, change: Partial<TownState>) => Town,
  ) {}

  room(waitingListCap: number): Result<void, DomainError> {
    const { workSlot, waitingList } = this.town
    if (workSlot.kind === 'busy' && waitingList.length >= waitingListCap) {
      return err({ kind: 'WaitingListFull', cap: waitingListCap })
    }
    return ok(undefined)
  }

  start(
    work: WaitingWork,
    stocksAtNow: Stocks,
    now: Instant,
    waitingListCap: number,
  ): Result<Town, DomainError> {
    const room = this.room(waitingListCap)
    if (!room.ok) {
      return room
    }
    const charged = chargedStocks(stocksAtNow, work.cost)
    if (!charged.ok) {
      return charged
    }
    const stocks = charged.value
    if (this.town.workSlot.kind === 'busy') {
      return ok(
        this.changed(this.town, {
          stocks,
          storedAt: now,
          waitingList: [...this.town.waitingList, work],
        }),
      )
    }
    const slot = busySlotOf(work, now)
    if (!slot.ok) {
      return slot
    }
    return ok(this.changed(this.town, { stocks, storedAt: now, workSlot: slot.value }))
  }

  stop(
    target: WorkTarget,
    stocksAtNow: Stocks,
    now: Instant,
    catalog: TownCatalog,
  ): Result<ChangedTown, DomainError> {
    const { workSlot: slot, waitingList } = this.town
    if (slot.kind === 'busy' && isWorkOf(target, slot)) {
      return this.stoppedWith(slot, idleWorkSlot, waitingList, stocksAtNow, now, catalog)
    }
    const position = waitingList.findIndex((work) => isWorkOf(target, work))
    const stoppedWork = waitingList[position]
    if (slot.kind === 'idle' || stoppedWork === undefined) {
      return err({ kind: 'BuildingWorkNotFound', building: target.building, level: target.level })
    }
    const rest = waitingList.filter((_, index) => index !== position)
    return this.stoppedWith(stoppedWork, slot, rest, stocksAtNow, now, catalog)
  }

  complete(stocksAtFinish: Stocks): Result<Town, DomainError> {
    const finished = this.town.workSlot
    if (finished.kind === 'idle') {
      return ok(this.town)
    }
    const buildingLevels = { ...this.town.buildingLevels, [finished.building]: finished.level }
    const [next, ...waitingList] = this.town.waitingList
    if (next === undefined) {
      return ok(
        this.changed(this.town, {
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
      this.changed(this.town, {
        stocks: stocksAtFinish,
        storedAt: finished.finishesAt,
        buildingLevels,
        workSlot: slot.value,
        waitingList,
      }),
    )
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
      this.town.buildingLevels,
      workSlot,
      rest,
      this.town.staffedHires,
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
      town: this.changed(this.town, {
        stocks: creditedStocks(stocksAtNow, refundOf(stopped)),
        storedAt: now,
        ...resumed.value,
      }),
      events: stopped.map((work) => workStoppedAt(work, now)),
    })
  }
}
