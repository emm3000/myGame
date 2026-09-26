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
import type { FiefBuildingLevels } from './FiefBuildingLevels'
import type { FiefId } from './FiefId'
import { FiefName } from './FiefName'
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

type Works = {
  readonly slot: BuildSlot
  readonly buildQueue: BuildQueue
}

const startedAt = (entry: BuildQueueEntry, at: Instant): Result<BusySlot, DomainError> => {
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

const worksAfterEnqueue = (
  works: Works,
  upgrade: BuildQueueEntry,
  now: Instant,
): Result<Works, DomainError> => {
  if (works.slot.kind === 'busy' || works.buildQueue.length > 0) {
    return ok({ slot: works.slot, buildQueue: [...works.buildQueue, upgrade] })
  }
  const slot = startedAt(upgrade, now)
  if (!slot.ok) {
    return slot
  }
  return ok({ slot: slot.value, buildQueue: [] })
}

const worksAfterFinish = (
  buildQueue: BuildQueue,
  finishedAt: Instant,
): Result<Works, DomainError> => {
  const [next, ...waiting] = buildQueue
  if (next === undefined) {
    return ok({ slot: { kind: 'idle' }, buildQueue: [] })
  }
  const slot = startedAt(next, finishedAt)
  if (!slot.ok) {
    return slot
  }
  return ok({ slot: slot.value, buildQueue: waiting })
}

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
    const works = worksAfterEnqueue({ slot: this.slot, buildQueue: this.buildQueue }, upgrade, now)
    if (!works.ok) {
      return works
    }
    return ok(
      new Fief(
        this.id,
        this.playerId,
        this.name,
        this.coordinates,
        debit(stocksAtNow, upgrade.cost),
        now,
        this.buildingLevels,
        works.value.slot,
        works.value.buildQueue,
      ),
    )
  }

  roomForUpgrade(buildQueueCap: number): Result<void, DomainError> {
    const takesSlot = this.slot.kind === 'idle' && this.buildQueue.length === 0
    if (!takesSlot && this.buildQueue.length >= buildQueueCap) {
      return err({ kind: 'QueueFull', cap: buildQueueCap })
    }
    return ok(undefined)
  }

  cancelUpgrade(stocksAtNow: Stocks, now: Instant): Result<Fief, DomainError> {
    const { slot } = this
    if (slot.kind === 'idle' || slot.finishesAt.epochMilliseconds <= now.epochMilliseconds) {
      return err({ kind: 'SlotIdle' })
    }
    return ok(
      new Fief(
        this.id,
        this.playerId,
        this.name,
        this.coordinates,
        credit(stocksAtNow, slot.cost),
        now,
        this.buildingLevels,
        { kind: 'idle' },
        this.buildQueue,
      ),
    )
  }

  completeUpgrade(finished: BusySlot, stocksAtFinish: Stocks): Result<Fief, DomainError> {
    const { building, targetLevel, finishesAt } = finished
    const works = worksAfterFinish(this.buildQueue, finishesAt)
    if (!works.ok) {
      return works
    }
    return ok(
      new Fief(
        this.id,
        this.playerId,
        this.name,
        this.coordinates,
        stocksAtFinish,
        finishesAt,
        { ...this.buildingLevels, [building]: targetLevel },
        works.value.slot,
        works.value.buildQueue,
      ),
    )
  }

  accruedTo(catalog: BuildingCatalog, now: Instant): Result<Fief, DomainError> {
    const stocksAtNow = materializeStocks(this, catalog, now)
    if (!stocksAtNow.ok) {
      return stocksAtNow
    }
    return ok(
      new Fief(
        this.id,
        this.playerId,
        this.name,
        this.coordinates,
        stocksAtNow.value,
        now,
        this.buildingLevels,
        this.slot,
        this.buildQueue,
      ),
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
