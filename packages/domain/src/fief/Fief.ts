import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingCatalog, BuildingKind } from '../ports/BuildingCatalog'
import { err, ok, type Result } from '../Result'
import type { ResourceKind } from '../resources/Resources'
import { Duration } from '../time/Duration'
import type { Instant } from '../time/Instant'
import type { BuildQueue, BuildQueueEntry } from './BuildQueue'
import type { BuildSlot, BusySlot } from './BuildSlot'
import { Coordinates } from './Coordinates'
import { entryFitsProjection } from './entryFitsProjection'
import type { FiefBuildingLevels } from './FiefBuildingLevels'
import type { FiefId } from './FiefId'
import { FiefName } from './FiefName'
import { isSlotFinishedBy } from './isSlotFinishedBy'
import { materializeStocks } from './materializeStocks'
import type { PlotAddress } from './PlotAddress'
import type { Terrain } from './Terrain'
import { terrainOf } from './terrainOf'

export type Stocks = Readonly<Record<ResourceKind, number>>

export type FiefFounding = {
  readonly id: FiefId
  readonly playerId: PlayerId
  readonly name: FiefName
  readonly coordinates: Coordinates
  readonly startingStocks: Stocks
  readonly at: Instant
}

export type StoredFief = {
  readonly id: FiefId
  readonly playerId: PlayerId
  readonly name: string
  readonly address: PlotAddress
  readonly stocks: Stocks
  readonly storedAt: Instant
  readonly buildingLevels: FiefBuildingLevels
  readonly slot: BuildSlot
  readonly buildQueue: BuildQueue
}

const debit = (stocks: Stocks, cost: Stocks): Stocks => ({
  wood: stocks.wood - cost.wood,
  stone: stocks.stone - cost.stone,
  iron: stocks.iron - cost.iron,
  gold: stocks.gold - cost.gold,
  food: stocks.food - cost.food,
})

const credit = (stocks: Stocks, refund: Stocks): Stocks => ({
  wood: stocks.wood + refund.wood,
  stone: stocks.stone + refund.stone,
  iron: stocks.iron + refund.iron,
  gold: stocks.gold + refund.gold,
  food: stocks.food + refund.food,
})

const shortfall = (stocks: Stocks, cost: Stocks): Stocks => ({
  wood: Math.max(0, cost.wood - stocks.wood),
  stone: Math.max(0, cost.stone - stocks.stone),
  iron: Math.max(0, cost.iron - stocks.iron),
  gold: Math.max(0, cost.gold - stocks.gold),
  food: Math.max(0, cost.food - stocks.food),
})

const isShort = (missing: Stocks): boolean => Object.values(missing).some((amount) => amount > 0)

const unbuiltLevels: FiefBuildingLevels = {
  sawmill: 0,
  quarry: 0,
  ironMine: 0,
  farm: 0,
  warehouse: 0,
}

const isBuildingKind = (key: string): key is BuildingKind => key in unbuiltLevels

const buildingKinds: ReadonlyArray<BuildingKind> = Object.keys(unbuiltLevels).filter(isBuildingKind)

const isWholeLevel = (level: number): boolean => Number.isInteger(level) && level >= 0

const refuseNegativeAmount = (stocks: Stocks): Result<void, DomainError> => {
  const negativeAmount = Object.values(stocks).find((amount) => amount < 0)
  if (negativeAmount !== undefined) {
    return err({ kind: 'NegativeResourceAmount', amount: negativeAmount })
  }
  return ok(undefined)
}

const isTargetLevel = (level: number): boolean => Number.isInteger(level) && level >= 1

const validateEntry = (entry: BuildQueueEntry): Result<void, DomainError> => {
  if (!isTargetLevel(entry.targetLevel)) {
    return err({ kind: 'InvalidBuildingLevel', building: entry.building, level: entry.targetLevel })
  }
  if (entry.durationSeconds < 0) {
    return err({ kind: 'NegativeDuration', seconds: entry.durationSeconds })
  }
  if (!Number.isInteger(entry.durationSeconds)) {
    return err({ kind: 'FractionalDuration', seconds: entry.durationSeconds })
  }
  return refuseNegativeAmount(entry.cost)
}

const validateBuildQueue = (buildQueue: BuildQueue): Result<void, DomainError> => {
  for (const entry of buildQueue) {
    const validEntry = validateEntry(entry)
    if (!validEntry.ok) {
      return validEntry
    }
  }
  return ok(undefined)
}

const validateSlot = (slot: BuildSlot, storedAt: Instant): Result<void, DomainError> => {
  if (slot.kind === 'idle') {
    return ok(undefined)
  }
  if (!isTargetLevel(slot.targetLevel)) {
    return err({ kind: 'InvalidBuildingLevel', building: slot.building, level: slot.targetLevel })
  }
  if (slot.finishesAt.epochMilliseconds < storedAt.epochMilliseconds) {
    return err({ kind: 'SlotFinishesBeforeStored', storedAt, finishesAt: slot.finishesAt })
  }
  if (slot.startedAt.epochMilliseconds > slot.finishesAt.epochMilliseconds) {
    return err({
      kind: 'SlotStartsAfterFinish',
      startedAt: slot.startedAt,
      finishesAt: slot.finishesAt,
    })
  }
  return refuseNegativeAmount(slot.cost)
}

const validateStoredState = (stored: StoredFief): Result<void, DomainError> => {
  const storedStocks = refuseNegativeAmount(stored.stocks)
  if (!storedStocks.ok) {
    return storedStocks
  }
  const invalidBuilding = buildingKinds.find(
    (building) => !isWholeLevel(stored.buildingLevels[building]),
  )
  if (invalidBuilding !== undefined) {
    return err({
      kind: 'InvalidBuildingLevel',
      building: invalidBuilding,
      level: stored.buildingLevels[invalidBuilding],
    })
  }
  const storedSlot = validateSlot(stored.slot, stored.storedAt)
  if (!storedSlot.ok) {
    return storedSlot
  }
  return validateBuildQueue(stored.buildQueue)
}

type SlotAndQueue = {
  readonly slot: BuildSlot
  readonly buildQueue: BuildQueue
}

type FiefChange = SlotAndQueue & {
  readonly stocks: Stocks
  readonly storedAt: Instant
  readonly buildingLevels: FiefBuildingLevels
}

const startEntryAt = (entry: BuildQueueEntry, at: Instant): Result<BusySlot, DomainError> => {
  const duration = Duration.ofSeconds(entry.durationSeconds)
  if (!duration.ok) {
    return duration
  }
  const { building, targetLevel, cost } = entry
  return ok({
    kind: 'busy',
    building,
    targetLevel,
    startedAt: at,
    finishesAt: at.plus(duration.value),
    cost,
  })
}

const slotAndQueueAfterEnqueue = (
  current: SlotAndQueue,
  upgrade: BuildQueueEntry,
  now: Instant,
): Result<SlotAndQueue, DomainError> => {
  if (current.slot.kind === 'busy' || current.buildQueue.length > 0) {
    return ok({ slot: current.slot, buildQueue: [...current.buildQueue, upgrade] })
  }
  return slotAndQueueStartingAt([upgrade], now)
}

const slotAndQueueStartingAt = (
  buildQueue: BuildQueue,
  at: Instant,
): Result<SlotAndQueue, DomainError> => {
  const [next, ...waiting] = buildQueue
  if (next === undefined) {
    return ok({ slot: { kind: 'idle' }, buildQueue: [] })
  }
  const slot = startEntryAt(next, at)
  if (!slot.ok) {
    return slot
  }
  return ok({ slot: slot.value, buildQueue: waiting })
}

type RevalidatedQueue = {
  readonly buildQueue: BuildQueue
  readonly refund: Stocks
}

const revalidateBuildQueue = (
  buildingLevels: FiefBuildingLevels,
  buildQueue: BuildQueue,
  catalog: BuildingCatalog,
): Result<RevalidatedQueue, DomainError> => {
  const projected = { ...buildingLevels }
  const kept: Array<BuildQueueEntry> = []
  let refund: Stocks = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }
  for (const entry of buildQueue) {
    const fits = entryFitsProjection(projected, entry, catalog)
    if (!fits.ok) {
      return fits
    }
    if (fits.value) {
      kept.push(entry)
      projected[entry.building] = entry.targetLevel
    } else {
      refund = credit(refund, entry.cost)
    }
  }
  return ok({ buildQueue: kept, refund })
}

type Cancellation = SlotAndQueue & {
  readonly refund: Stocks
}

const cancellationAt = (
  current: SlotAndQueue,
  position: number,
  now: Instant,
): Result<Cancellation, DomainError> => {
  const { slot, buildQueue } = current
  if (position === 0) {
    if (slot.kind === 'idle' || isSlotFinishedBy(slot, now)) {
      return err({ kind: 'UpgradeNotFound', position })
    }
    return ok({ slot: { kind: 'idle' }, buildQueue, refund: slot.cost })
  }
  const entry = buildQueue[position - 1]
  if (entry === undefined) {
    return err({ kind: 'UpgradeNotFound', position })
  }
  const remaining = buildQueue.filter((_, index) => index !== position - 1)
  return ok({ slot, buildQueue: remaining, refund: entry.cost })
}

const levelsWithSlot = (buildingLevels: FiefBuildingLevels, slot: BuildSlot): FiefBuildingLevels =>
  slot.kind === 'busy' ? { ...buildingLevels, [slot.building]: slot.targetLevel } : buildingLevels

const slotAndQueueResumingAt = (
  current: SlotAndQueue,
  at: Instant,
): Result<SlotAndQueue, DomainError> =>
  current.slot.kind === 'busy' ? ok(current) : slotAndQueueStartingAt(current.buildQueue, at)

export class Fief {
  private constructor(
    readonly id: FiefId,
    readonly playerId: PlayerId,
    readonly name: FiefName,
    readonly coordinates: Coordinates,
    readonly stocks: Stocks,
    readonly storedAt: Instant,
    readonly buildingLevels: FiefBuildingLevels,
    readonly slot: BuildSlot,
    readonly buildQueue: BuildQueue,
  ) {}

  static found(founding: FiefFounding): Fief {
    return new Fief(
      founding.id,
      founding.playerId,
      founding.name,
      founding.coordinates,
      founding.startingStocks,
      founding.at,
      unbuiltLevels,
      { kind: 'idle' },
      [],
    )
  }

  static restore(stored: StoredFief): Result<Fief, DomainError> {
    const name = FiefName.create(stored.name)
    if (!name.ok) {
      return name
    }
    const storedState = validateStoredState(stored)
    if (!storedState.ok) {
      return storedState
    }
    const { kingdom, province, plot } = stored.address
    const coordinates = Coordinates.create(kingdom, province, plot)
    if (!coordinates.ok) {
      return coordinates
    }
    return ok(
      new Fief(
        stored.id,
        stored.playerId,
        name.value,
        coordinates.value,
        stored.stocks,
        stored.storedAt,
        stored.buildingLevels,
        stored.slot,
        stored.buildQueue,
      ),
    )
  }

  enqueueUpgrade(
    upgrade: BuildQueueEntry,
    stocksAtNow: Stocks,
    now: Instant,
    buildQueueCap: number,
  ): Result<Fief, DomainError> {
    const room = this.roomForUpgrade(buildQueueCap)
    if (!room.ok) {
      return room
    }
    const validUpgrade = validateEntry(upgrade)
    if (!validUpgrade.ok) {
      return validUpgrade
    }
    const missing = shortfall(stocksAtNow, upgrade.cost)
    if (isShort(missing)) {
      return err({ kind: 'InsufficientResources', missing })
    }
    const next = slotAndQueueAfterEnqueue(this, upgrade, now)
    if (!next.ok) {
      return next
    }
    return ok(
      this.changed({
        ...next.value,
        stocks: debit(stocksAtNow, upgrade.cost),
        storedAt: now,
        buildingLevels: this.buildingLevels,
      }),
    )
  }

  roomForUpgrade(buildQueueCap: number): Result<void, DomainError> {
    const takesSlot = this.slot.kind === 'idle' && this.buildQueue.length === 0
    if (!takesSlot && this.buildQueue.length >= buildQueueCap) {
      return err({ kind: 'QueueFull', cap: buildQueueCap })
    }
    return ok(undefined)
  }

  cancelUpgrade(
    position: number,
    stocksAtNow: Stocks,
    now: Instant,
    catalog: BuildingCatalog,
  ): Result<Fief, DomainError> {
    const cancellation = cancellationAt(this, position, now)
    if (!cancellation.ok) {
      return cancellation
    }
    const { slot, buildQueue, refund } = cancellation.value
    const projectedFrom = levelsWithSlot(this.buildingLevels, slot)
    const revalidated = revalidateBuildQueue(projectedFrom, buildQueue, catalog)
    if (!revalidated.ok) {
      return revalidated
    }
    const next = slotAndQueueResumingAt({ slot, buildQueue: revalidated.value.buildQueue }, now)
    if (!next.ok) {
      return next
    }
    return ok(
      this.changed({
        ...next.value,
        stocks: credit(credit(stocksAtNow, refund), revalidated.value.refund),
        storedAt: now,
        buildingLevels: this.buildingLevels,
      }),
    )
  }

  get isSlotIdleWithQueue(): boolean {
    return this.slot.kind === 'idle' && this.buildQueue.length > 0
  }

  resumeBuildQueue(catalog: BuildingCatalog): Result<Fief, DomainError> {
    if (!this.isSlotIdleWithQueue) {
      return ok(this)
    }
    const revalidated = revalidateBuildQueue(this.buildingLevels, this.buildQueue, catalog)
    if (!revalidated.ok) {
      return revalidated
    }
    const next = slotAndQueueStartingAt(revalidated.value.buildQueue, this.storedAt)
    if (!next.ok) {
      return next
    }
    return ok(
      this.changed({
        ...next.value,
        stocks: credit(this.stocks, revalidated.value.refund),
        storedAt: this.storedAt,
        buildingLevels: this.buildingLevels,
      }),
    )
  }

  completeUpgrade(finished: BusySlot, stocksAtFinish: Stocks): Result<Fief, DomainError> {
    const { building, targetLevel, finishesAt } = finished
    const next = slotAndQueueStartingAt(this.buildQueue, finishesAt)
    if (!next.ok) {
      return next
    }
    return ok(
      this.changed({
        ...next.value,
        stocks: stocksAtFinish,
        storedAt: finishesAt,
        buildingLevels: { ...this.buildingLevels, [building]: targetLevel },
      }),
    )
  }

  accruedTo(catalog: BuildingCatalog, now: Instant): Result<Fief, DomainError> {
    const stocksAtNow = materializeStocks(this, catalog, now)
    if (!stocksAtNow.ok) {
      return stocksAtNow
    }
    return ok(
      this.changed({
        stocks: stocksAtNow.value,
        storedAt: now,
        buildingLevels: this.buildingLevels,
        slot: this.slot,
        buildQueue: this.buildQueue,
      }),
    )
  }

  private changed(change: FiefChange): Fief {
    return new Fief(
      this.id,
      this.playerId,
      this.name,
      this.coordinates,
      change.stocks,
      change.storedAt,
      change.buildingLevels,
      change.slot,
      change.buildQueue,
    )
  }

  get projectedBuildingLevels(): FiefBuildingLevels {
    const projected = { ...this.buildingLevels }
    if (this.slot.kind === 'busy') {
      projected[this.slot.building] = this.slot.targetLevel
    }
    for (const { building, targetLevel } of this.buildQueue) {
      projected[building] = targetLevel
    }
    return projected
  }

  get terrain(): Terrain {
    return terrainOf(this.coordinates)
  }
}
