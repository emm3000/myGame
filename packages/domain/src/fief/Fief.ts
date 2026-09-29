import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type {
  ArtLevel,
  BuildingCatalog,
  BuildingKind,
  UnitKind,
  UnitTerms,
} from '../ports/BuildingCatalog'
import { err, ok, type Result } from '../Result'
import type { ResourceKind } from '../resources/Resources'
import { Duration } from '../time/Duration'
import type { Instant } from '../time/Instant'
import { artKinds } from './artKinds'
import type { BuildQueue, BuildQueueEntry, UpgradeTarget } from './BuildQueue'
import type { BuildSlot, BusySlot } from './BuildSlot'
import type { ChangedFief } from './ChangedFief'
import { Coordinates } from './Coordinates'
import { deliveredUnitsOf } from './deliveredUnitsOf'
import { deriveStudyDurationSeconds } from './deriveStudyDurationSeconds'
import { deriveUnitDurationSeconds } from './deriveUnitDurationSeconds'
import { entryFitsProjection } from './entryFitsProjection'
import type { FiefArtLevels } from './FiefArtLevels'
import type { FiefBuildingLevels } from './FiefBuildingLevels'
import type { FiefEvent } from './FiefEvent'
import type { FiefId } from './FiefId'
import { FiefName } from './FiefName'
import { FiefUnitCounts, type UnitCountsByKind } from './FiefUnitCounts'
import { isSlotFinishedBy } from './isSlotFinishedBy'
import { materializeStocks } from './materializeStocks'
import type { PlotAddress } from './PlotAddress'
import type { OpenRecruitOrder, RecruitOrder } from './RecruitOrder'
import { recruitOrderEndsAt } from './recruitOrderEndsAt'
import type { BusyStudySlot, StudySlot, StudyTarget } from './StudySlot'
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
  readonly artLevels: FiefArtLevels
  readonly units: UnitCountsByKind
  readonly slot: BuildSlot
  readonly buildQueue: BuildQueue
  readonly studySlot: StudySlot
  readonly recruitOrder: RecruitOrder
}

export type RecruitRequest = {
  readonly unit: UnitKind
  readonly count: number
  readonly terms: UnitTerms
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
  library: 0,
  barracks: 0,
}

const unstudiedArts: FiefArtLevels = { smithing: 0, masonry: 0 }

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

type TimedWork = {
  readonly startedAt: Instant
  readonly finishesAt: Instant
  readonly cost: Stocks
}

const validateTimedWork = (work: TimedWork, storedAt: Instant): Result<void, DomainError> => {
  if (work.finishesAt.epochMilliseconds < storedAt.epochMilliseconds) {
    return err({ kind: 'SlotFinishesBeforeStored', storedAt, finishesAt: work.finishesAt })
  }
  if (work.startedAt.epochMilliseconds > work.finishesAt.epochMilliseconds) {
    return err({
      kind: 'SlotStartsAfterFinish',
      startedAt: work.startedAt,
      finishesAt: work.finishesAt,
    })
  }
  return refuseNegativeAmount(work.cost)
}

const validateSlot = (slot: BuildSlot, storedAt: Instant): Result<void, DomainError> => {
  if (slot.kind === 'idle') {
    return ok(undefined)
  }
  if (!isTargetLevel(slot.targetLevel)) {
    return err({ kind: 'InvalidBuildingLevel', building: slot.building, level: slot.targetLevel })
  }
  return validateTimedWork(slot, storedAt)
}

const validateStudySlot = (studySlot: StudySlot, storedAt: Instant): Result<void, DomainError> => {
  if (studySlot.kind === 'idle') {
    return ok(undefined)
  }
  if (!isTargetLevel(studySlot.targetLevel)) {
    return err({ kind: 'InvalidArtLevel', art: studySlot.art, level: studySlot.targetLevel })
  }
  return validateTimedWork(studySlot, storedAt)
}

const isUnitCount = (count: number): boolean => Number.isInteger(count) && count >= 1

const validateRecruitOrder = (
  recruitOrder: RecruitOrder,
  storedAt: Instant,
): Result<void, DomainError> => {
  if (recruitOrder.kind === 'idle') {
    return ok(undefined)
  }
  if (!isUnitCount(recruitOrder.count)) {
    return err({ kind: 'InvalidUnitCount', unit: recruitOrder.unit, count: recruitOrder.count })
  }
  if (!isUnitCount(recruitOrder.perUnitSeconds)) {
    return err({
      kind: 'InvalidUnitDuration',
      unit: recruitOrder.unit,
      seconds: recruitOrder.perUnitSeconds,
    })
  }
  const endsAt = recruitOrderEndsAt(recruitOrder)
  if (endsAt.epochMilliseconds < storedAt.epochMilliseconds) {
    return err({ kind: 'SlotFinishesBeforeStored', storedAt, finishesAt: endsAt })
  }
  return refuseNegativeAmount(recruitOrder.cost)
}

const timesCount = (cost: Stocks, count: number): Stocks => ({
  wood: cost.wood * count,
  stone: cost.stone * count,
  iron: cost.iron * count,
  gold: cost.gold * count,
  food: cost.food * count,
})

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
  const invalidArt = artKinds.find((art) => !isWholeLevel(stored.artLevels[art]))
  if (invalidArt !== undefined) {
    return err({ kind: 'InvalidArtLevel', art: invalidArt, level: stored.artLevels[invalidArt] })
  }
  const storedSlot = validateSlot(stored.slot, stored.storedAt)
  if (!storedSlot.ok) {
    return storedSlot
  }
  const storedStudySlot = validateStudySlot(stored.studySlot, stored.storedAt)
  if (!storedStudySlot.ok) {
    return storedStudySlot
  }
  const storedRecruitOrder = validateRecruitOrder(stored.recruitOrder, stored.storedAt)
  if (!storedRecruitOrder.ok) {
    return storedRecruitOrder
  }
  return validateBuildQueue(stored.buildQueue)
}

type SlotAndQueue = {
  readonly slot: BuildSlot
  readonly buildQueue: BuildQueue
}

type FiefChange = Partial<
  SlotAndQueue & {
    readonly stocks: Stocks
    readonly storedAt: Instant
    readonly buildingLevels: FiefBuildingLevels
    readonly artLevels: FiefArtLevels
    readonly units: FiefUnitCounts
    readonly studySlot: StudySlot
    readonly recruitOrder: RecruitOrder
  }
>

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
  readonly dropped: BuildQueue
}

const noStocks: Stocks = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

const refundOf = (dropped: BuildQueue): Stocks =>
  dropped.reduce((refund, entry) => credit(refund, entry.cost), noStocks)

const revalidateBuildQueue = (
  buildingLevels: FiefBuildingLevels,
  units: FiefUnitCounts,
  recruitOrder: RecruitOrder,
  buildQueue: BuildQueue,
  catalog: BuildingCatalog,
): Result<RevalidatedQueue, DomainError> => {
  const projected = { ...buildingLevels }
  const kept: Array<BuildQueueEntry> = []
  const dropped: Array<BuildQueueEntry> = []
  for (const entry of buildQueue) {
    const fits = entryFitsProjection(projected, units, recruitOrder, entry, catalog)
    if (!fits.ok) {
      return fits
    }
    if (fits.value) {
      kept.push(entry)
      projected[entry.building] = entry.targetLevel
    } else {
      dropped.push(entry)
    }
  }
  return ok({ buildQueue: kept, dropped })
}

type CancelledUpgrade = UpgradeTarget & {
  readonly cost: Stocks
}

type Cancellation = SlotAndQueue & {
  readonly cancelled: CancelledUpgrade
}

const upgradeCancelledAt = (cancelled: CancelledUpgrade, now: Instant): FiefEvent => ({
  kind: 'upgradeCancelled',
  building: cancelled.building,
  level: cancelled.targetLevel,
  occurredAt: now,
  refund: cancelled.cost,
})

const isUpgradeOf = (target: UpgradeTarget, upgrade: UpgradeTarget): boolean =>
  upgrade.building === target.building && upgrade.targetLevel === target.targetLevel

const cancellationOf = (
  current: SlotAndQueue,
  target: UpgradeTarget,
  now: Instant,
): Result<Cancellation, DomainError> => {
  const { slot, buildQueue } = current
  const notFound: Result<Cancellation, DomainError> = err({
    kind: 'UpgradeNotFound',
    building: target.building,
    targetLevel: target.targetLevel,
  })
  if (slot.kind === 'busy' && isSlotFinishedBy(slot, now)) {
    return notFound
  }
  if (slot.kind === 'busy' && isUpgradeOf(target, slot)) {
    return ok({ slot: { kind: 'idle' }, buildQueue, cancelled: slot })
  }
  const entry = buildQueue.find((waiting) => isUpgradeOf(target, waiting))
  if (entry === undefined) {
    return notFound
  }
  const remaining = buildQueue.filter((waiting) => waiting !== entry)
  return ok({ slot, buildQueue: remaining, cancelled: entry })
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
    readonly artLevels: FiefArtLevels,
    readonly units: FiefUnitCounts,
    readonly slot: BuildSlot,
    readonly buildQueue: BuildQueue,
    readonly studySlot: StudySlot,
    readonly recruitOrder: RecruitOrder,
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
      unstudiedArts,
      FiefUnitCounts.none,
      { kind: 'idle' },
      [],
      { kind: 'idle' },
      { kind: 'idle' },
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
    const units = FiefUnitCounts.create(stored.units)
    if (!units.ok) {
      return units
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
        stored.artLevels,
        units.value,
        stored.slot,
        stored.buildQueue,
        stored.studySlot,
        stored.recruitOrder,
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
    target: UpgradeTarget,
    stocksAtNow: Stocks,
    now: Instant,
    catalog: BuildingCatalog,
  ): Result<ChangedFief, DomainError> {
    const cancellation = cancellationOf(this, target, now)
    if (!cancellation.ok) {
      return cancellation
    }
    const { slot, buildQueue, cancelled } = cancellation.value
    const projectedFrom = levelsWithSlot(this.buildingLevels, slot)
    const revalidated = revalidateBuildQueue(
      projectedFrom,
      this.units,
      this.recruitOrder,
      buildQueue,
      catalog,
    )
    if (!revalidated.ok) {
      return revalidated
    }
    const next = slotAndQueueResumingAt({ slot, buildQueue: revalidated.value.buildQueue }, now)
    if (!next.ok) {
      return next
    }
    const { dropped } = revalidated.value
    return ok({
      fief: this.changed({
        ...next.value,
        stocks: credit(credit(stocksAtNow, cancelled.cost), refundOf(dropped)),
        storedAt: now,
      }),
      events: [cancelled, ...dropped].map((upgrade) => upgradeCancelledAt(upgrade, now)),
    })
  }

  cancelStudy(
    target: StudyTarget,
    stocksAtNow: Stocks,
    now: Instant,
  ): Result<ChangedFief, DomainError> {
    const { studySlot } = this
    if (
      studySlot.kind === 'idle' ||
      studySlot.art !== target.art ||
      studySlot.targetLevel !== target.targetLevel ||
      isSlotFinishedBy(studySlot, now)
    ) {
      return err({ kind: 'StudyNotFound', art: target.art, targetLevel: target.targetLevel })
    }
    return ok({
      fief: this.changed({
        studySlot: { kind: 'idle' },
        stocks: credit(stocksAtNow, studySlot.cost),
        storedAt: now,
      }),
      events: [
        {
          kind: 'studyCancelled',
          art: studySlot.art,
          level: studySlot.targetLevel,
          occurredAt: now,
          refund: studySlot.cost,
        },
      ],
    })
  }

  startStudy(
    line: ArtLevel,
    stocksAtNow: Stocks,
    now: Instant,
    studyPercent: number,
  ): Result<Fief, DomainError> {
    if (this.studySlot.kind === 'busy') {
      return err({ kind: 'StudySlotBusy', art: this.studySlot.art })
    }
    const libraryLevel = this.buildingLevels.library
    if (libraryLevel < line.requiredLibraryLevel) {
      return err({
        kind: 'LibraryLevelTooLow',
        requiredLibraryLevel: line.requiredLibraryLevel,
        libraryLevel,
      })
    }
    const missing = shortfall(stocksAtNow, line.cost)
    if (isShort(missing)) {
      return err({ kind: 'InsufficientResources', missing })
    }
    const duration = Duration.ofSeconds(
      deriveStudyDurationSeconds(line.durationSeconds, libraryLevel, studyPercent),
    )
    if (!duration.ok) {
      return duration
    }
    const { art, level, cost } = line
    return ok(
      this.changed({
        studySlot: {
          kind: 'busy',
          art,
          targetLevel: level,
          startedAt: now,
          finishesAt: now.plus(duration.value),
          cost,
        },
        stocks: debit(stocksAtNow, cost),
        storedAt: now,
      }),
    )
  }

  placeRecruitOrder(
    request: RecruitRequest,
    stocksAtNow: Stocks,
    now: Instant,
  ): Result<Fief, DomainError> {
    const { unit, count, terms } = request
    if (!isUnitCount(count)) {
      return err({ kind: 'InvalidUnitCount', unit, count })
    }
    const barracksLevel = this.buildingLevels.barracks
    if (barracksLevel < 1) {
      return err({ kind: 'BarracksNotBuilt' })
    }
    if (this.recruitOrder.kind === 'open') {
      return err({ kind: 'RecruitSlotBusy', unit: this.recruitOrder.unit })
    }
    const cost = timesCount(terms.cost, count)
    const missing = shortfall(stocksAtNow, cost)
    if (isShort(missing)) {
      return err({ kind: 'InsufficientResources', missing })
    }
    return ok(
      this.changed({
        recruitOrder: {
          kind: 'open',
          unit,
          count,
          cost,
          perUnitSeconds: deriveUnitDurationSeconds(terms.durationSeconds, barracksLevel),
          startedAt: now,
        },
        stocks: debit(stocksAtNow, cost),
        storedAt: now,
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
    const revalidated = revalidateBuildQueue(
      this.buildingLevels,
      this.units,
      this.recruitOrder,
      this.buildQueue,
      catalog,
    )
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
        stocks: credit(this.stocks, refundOf(revalidated.value.dropped)),
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

  completeStudy(finished: BusyStudySlot, stocksAtFinish: Stocks): Fief {
    const { art, targetLevel, finishesAt } = finished
    return this.changed({
      stocks: stocksAtFinish,
      storedAt: finishesAt,
      artLevels: { ...this.artLevels, [art]: targetLevel },
      studySlot: { kind: 'idle' },
    })
  }

  completeRecruitOrder(ended: OpenRecruitOrder, stocksAtEnd: Stocks): Fief {
    return this.changed({
      stocks: stocksAtEnd,
      storedAt: recruitOrderEndsAt(ended),
      units: this.units.plus(ended.unit, ended.count),
      recruitOrder: { kind: 'idle' },
    })
  }

  unitCountsAt(at: Instant): FiefUnitCounts {
    const { recruitOrder } = this
    if (recruitOrder.kind === 'idle') {
      return this.units
    }
    return this.units.plus(recruitOrder.unit, deliveredUnitsOf(recruitOrder, at))
  }

  accruedTo(catalog: BuildingCatalog, now: Instant): Result<Fief, DomainError> {
    const stocksAtNow = materializeStocks(this, catalog, now)
    if (!stocksAtNow.ok) {
      return stocksAtNow
    }
    return ok(this.changed({ stocks: stocksAtNow.value, storedAt: now }))
  }

  private changed(change: FiefChange): Fief {
    return new Fief(
      this.id,
      this.playerId,
      this.name,
      this.coordinates,
      change.stocks ?? this.stocks,
      change.storedAt ?? this.storedAt,
      change.buildingLevels ?? this.buildingLevels,
      change.artLevels ?? this.artLevels,
      change.units ?? this.units,
      change.slot ?? this.slot,
      change.buildQueue ?? this.buildQueue,
      change.studySlot ?? this.studySlot,
      change.recruitOrder ?? this.recruitOrder,
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
    return terrainOf(this.coordinates.province)
  }
}
