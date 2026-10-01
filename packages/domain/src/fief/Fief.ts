import { attackLootOf } from '../camp/attackLootOf'
import { type Battle, battleOf } from '../camp/battleOf'
import type { DomainError } from '../DomainError'
import { forageLootOf } from '../march/forageLootOf'
import { forageLootOfMilliseconds } from '../march/forageLootOfMilliseconds'
import type { AttackedCamp, AttackMarch, AwayMarch, LootPercent, March } from '../march/March'
import { marchInstantsOf } from '../march/marchInstantsOf'
import { marchOneWaySeconds } from '../march/marchOneWaySeconds'
import { marchPhaseAt } from '../march/marchPhaseAt'
import { refuseInvalidParty } from '../march/refuseInvalidParty'
import type { PlayerId } from '../player/PlayerId'
import type {
  ArtLevel,
  BuildingCatalog,
  BuildingKind,
  FiefSettings,
  UnitKind,
  UnitTerms,
} from '../ports/BuildingCatalog'
import { err, ok, type Result } from '../Result'
import type { ResourceKind } from '../resources/Resources'
import { resourceKinds } from '../resources/resourceKinds'
import { Duration } from '../time/Duration'
import { Instant } from '../time/Instant'
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
import type { OpenRecruitOrder, RecruitOrder, RecruitOrderTarget } from './RecruitOrder'
import { recruitOrderEndsAt } from './recruitOrderEndsAt'
import type { BusyStudySlot, StudySlot, StudyTarget } from './StudySlot'
import type { Terrain } from './Terrain'
import { terrainOf } from './terrainOf'
import { unitKinds } from './unitKinds'

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
  readonly march: March
}

export type RecruitRequest = {
  readonly unit: UnitKind
  readonly count: number
  readonly terms: UnitTerms
}

export type MarchTarget = {
  readonly departedAt: Instant
}

export type MarchOrder = {
  readonly province: number
  readonly plot: number
  readonly units: UnitCountsByKind
  readonly stayHours: number
}

export type AttackOrder = {
  readonly province: number
  readonly plot: number
  readonly units: UnitCountsByKind
}

export type MarchTerms = Pick<FiefSettings, 'forage' | 'units'>

export type AttackTerms = Pick<FiefSettings, 'forage' | 'camps' | 'units'>

export type MarchSeason = {
  readonly roadPercent: number
  readonly lootPercent: LootPercent
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

const isWholeFromOne = (count: number): boolean => Number.isInteger(count) && count >= 1

const validateRecruitOrder = (
  recruitOrder: RecruitOrder,
  storedAt: Instant,
): Result<void, DomainError> => {
  if (recruitOrder.kind === 'idle') {
    return ok(undefined)
  }
  if (!isWholeFromOne(recruitOrder.count)) {
    return err({ kind: 'InvalidUnitCount', unit: recruitOrder.unit, count: recruitOrder.count })
  }
  if (!isWholeFromOne(recruitOrder.perUnitSeconds)) {
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

const validateRecall = (march: AwayMarch): Result<void, DomainError> => {
  const { recalledAt, ...unrecalled } = march
  if (recalledAt === undefined) {
    return ok(undefined)
  }
  const { departedAt } = unrecalled
  if (recalledAt.epochMilliseconds < departedAt.epochMilliseconds) {
    return err({ kind: 'SlotStartsAfterFinish', startedAt: departedAt, finishesAt: recalledAt })
  }
  const { leavesAt } = marchInstantsOf(unrecalled)
  if (recalledAt.epochMilliseconds >= leavesAt.epochMilliseconds) {
    return err({ kind: 'SlotStartsAfterFinish', startedAt: recalledAt, finishesAt: leavesAt })
  }
  return ok(undefined)
}

const campTiers: ReadonlyArray<number> = [1, 2, 3]

const validateOrder = (march: AwayMarch): Result<void, DomainError> => {
  if (march.order === 'forage') {
    return isWholeFromOne(march.stayHours)
      ? ok(undefined)
      : err({ kind: 'StayOutOfRange', stayHours: march.stayHours })
  }
  if (march.stayHours !== 0) {
    return err({ kind: 'StayOutOfRange', stayHours: march.stayHours })
  }
  const { tier, strength } = march.camp
  if (!campTiers.includes(tier) || !isWholeLevel(strength)) {
    return err({ kind: 'InvalidCamp', tier, strength })
  }
  return ok(undefined)
}

const refuseInvalidLootPercent = (lootPercent: LootPercent): Result<void, DomainError> => {
  const resource = resourceKinds.find((kind) => !isWholeFromOne(lootPercent[kind]))
  if (resource !== undefined) {
    return err({ kind: 'InvalidLootPercent', resource, percent: lootPercent[resource] })
  }
  return ok(undefined)
}

const validateMarch = (march: March, storedAt: Instant): Result<void, DomainError> => {
  if (march.kind === 'idle') {
    return ok(undefined)
  }
  const party = refuseInvalidParty(march.units)
  if (!party.ok) {
    return party
  }
  const order = validateOrder(march)
  if (!order.ok) {
    return order
  }
  if (march.oneWaySeconds < 0) {
    return err({ kind: 'NegativeDuration', seconds: march.oneWaySeconds })
  }
  if (!Number.isInteger(march.oneWaySeconds)) {
    return err({ kind: 'FractionalDuration', seconds: march.oneWaySeconds })
  }
  const recall = validateRecall(march)
  if (!recall.ok) {
    return recall
  }
  const { returnsAt } = marchInstantsOf(march)
  if (returnsAt.epochMilliseconds < storedAt.epochMilliseconds) {
    return err({ kind: 'SlotFinishesBeforeStored', storedAt, finishesAt: returnsAt })
  }
  const loot = refuseNegativeAmount(march.loot)
  if (!loot.ok) {
    return loot
  }
  return refuseInvalidLootPercent(march.lootPercent)
}

const timesCount = (cost: Stocks, count: number): Stocks => ({
  wood: cost.wood * count,
  stone: cost.stone * count,
  iron: cost.iron * count,
  gold: cost.gold * count,
  food: cost.food * count,
})

const MILLISECONDS_PER_SECOND = 1_000

const shareOf = (cost: Stocks, part: number, whole: number): Stocks => ({
  wood: (cost.wood * part) / whole,
  stone: (cost.stone * part) / whole,
  iron: (cost.iron * part) / whole,
  gold: (cost.gold * part) / whole,
  food: (cost.food * part) / whole,
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
  const storedMarch = validateMarch(stored.march, stored.storedAt)
  if (!storedMarch.ok) {
    return storedMarch
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
    readonly march: March
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
    readonly march: March,
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
        stored.march,
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

  cancelRecruitOrder(
    target: RecruitOrderTarget,
    stocksAtNow: Stocks,
    now: Instant,
  ): Result<ChangedFief, DomainError> {
    const { recruitOrder } = this
    if (
      recruitOrder.kind === 'idle' ||
      recruitOrder.unit !== target.unit ||
      recruitOrder.startedAt.epochMilliseconds !== target.startedAt.epochMilliseconds ||
      recruitOrderEndsAt(recruitOrder).epochMilliseconds <= now.epochMilliseconds
    ) {
      return err({ kind: 'RecruitOrderNotFound', unit: target.unit, startedAt: target.startedAt })
    }
    const delivered = deliveredUnitsOf(recruitOrder, now)
    const cancelled = recruitOrder.count - delivered
    const refund = shareOf(recruitOrder.cost, cancelled, recruitOrder.count)
    return ok({
      fief: this.changed({
        units: this.units.plus(recruitOrder.unit, delivered),
        recruitOrder: { kind: 'idle' },
        stocks: credit(stocksAtNow, refund),
        storedAt: now,
      }),
      events: [
        {
          kind: 'recruitsCancelled',
          unit: recruitOrder.unit,
          delivered,
          cancelled,
          occurredAt: now,
          refund,
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
    trainPercent: number,
  ): Result<Fief, DomainError> {
    const { unit, count, terms } = request
    if (!isWholeFromOne(count)) {
      return err({ kind: 'InvalidUnitCount', unit, count })
    }
    const barracksLevel = this.buildingLevels.barracks
    if (barracksLevel < 1) {
      return err({ kind: 'BarracksNotBuilt' })
    }
    if (barracksLevel < terms.barracksLevel) {
      return err({
        kind: 'BarracksTooLow',
        unit,
        requiredBarracksLevel: terms.barracksLevel,
        barracksLevel,
      })
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
          perUnitSeconds: deriveUnitDurationSeconds(
            terms.durationSeconds,
            barracksLevel,
            trainPercent,
          ),
          startedAt: now,
        },
        stocks: debit(stocksAtNow, cost),
        storedAt: now,
      }),
    )
  }

  roomForMarch(order: MarchOrder, maxStayHours: number): Result<void, DomainError> {
    const { units, stayHours } = order
    const party = refuseInvalidParty(units)
    if (!party.ok) {
      return party
    }
    if (!isWholeFromOne(stayHours) || stayHours > maxStayHours) {
      return err({ kind: 'StayOutOfRange', stayHours })
    }
    return this.refuseBusyMarchSlot()
  }

  roomForAttack(order: AttackOrder): Result<void, DomainError> {
    const party = refuseInvalidParty(order.units)
    if (!party.ok) {
      return party
    }
    return this.refuseBusyMarchSlot()
  }

  dispatchMarch(
    order: MarchOrder,
    now: Instant,
    terms: MarchTerms,
    season: MarchSeason,
  ): Result<Fief, DomainError> {
    const room = this.roomForMarch(order, terms.forage.maxStayHours)
    if (!room.ok) {
      return room
    }
    const { province, plot, units, stayHours } = order
    const atHome = this.refuseAbsentUnits(units, now)
    if (!atHome.ok) {
      return atHome
    }
    return ok(
      this.changed({
        march: {
          kind: 'away',
          order: 'forage',
          province,
          plot,
          units,
          stayHours,
          departedAt: now,
          oneWaySeconds: this.oneWaySecondsTo(province, plot, units, terms, season.roadPercent),
          loot: forageLootOf(terrainOf(province), units, stayHours, terms, season.lootPercent),
          lootPercent: season.lootPercent,
        },
      }),
    )
  }

  dispatchAttack(
    order: AttackOrder,
    camp: AttackedCamp,
    now: Instant,
    terms: AttackTerms,
    season: MarchSeason,
  ): Result<Fief, DomainError> {
    const room = this.roomForAttack(order)
    if (!room.ok) {
      return room
    }
    const { province, plot, units } = order
    const atHome = this.refuseAbsentUnits(units, now)
    if (!atHome.ok) {
      return atHome
    }
    const { survivors } = battleOf(units, camp.strength, terms.units)
    return ok(
      this.changed({
        march: {
          kind: 'away',
          order: 'attack',
          province,
          plot,
          units,
          stayHours: 0,
          departedAt: now,
          oneWaySeconds: this.oneWaySecondsTo(province, plot, units, terms, season.roadPercent),
          loot: attackLootOf(terrainOf(province), camp.strength, survivors, terms),
          lootPercent: season.lootPercent,
          camp,
          fought: false,
        },
      }),
    )
  }

  recallMarch(target: MarchTarget, now: Instant, terms: MarchTerms): Result<Fief, DomainError> {
    const { march } = this
    if (
      march.kind === 'idle' ||
      march.departedAt.epochMilliseconds !== target.departedAt.epochMilliseconds
    ) {
      return err({ kind: 'MarchNotFound', departedAt: target.departedAt })
    }
    if (marchPhaseAt(march, now) === 'returning') {
      return err({ kind: 'MarchAlreadyReturning' })
    }
    const { arrivesAt } = marchInstantsOf(march)
    const foragedMilliseconds = Math.max(0, now.epochMilliseconds - arrivesAt.epochMilliseconds)
    return ok(
      this.changed({
        march: {
          ...march,
          recalledAt: now,
          loot: forageLootOfMilliseconds(
            terrainOf(march.province),
            march.units,
            foragedMilliseconds,
            terms,
            march.lootPercent,
          ),
        },
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

  completeBattle(attack: AttackMarch, battle: Battle, stocksAtArrival: Stocks): Fief {
    const { arrivesAt } = marchInstantsOf(attack)
    const { units, recruitOrder } = this.deliveriesSettledAt(arrivesAt)
    return this.changed({
      stocks: stocksAtArrival,
      storedAt: arrivesAt,
      units: unitKinds.reduce((left, unit) => left.minus(unit, battle.unitsLost[unit]), units),
      recruitOrder,
      march: battle.won ? { ...attack, units: battle.survivors, fought: true } : { kind: 'idle' },
    })
  }

  completeMarch(returned: AwayMarch, stocksAtReturn: Stocks): Fief {
    return this.changed({
      stocks: credit(stocksAtReturn, returned.loot),
      storedAt: marchInstantsOf(returned).returnsAt,
      march: { kind: 'idle' },
    })
  }

  private deliveriesSettledAt(at: Instant): {
    readonly units: FiefUnitCounts
    readonly recruitOrder: RecruitOrder
  } {
    const { units, recruitOrder } = this
    if (recruitOrder.kind === 'idle') {
      return { units, recruitOrder }
    }
    const delivered = deliveredUnitsOf(recruitOrder, at)
    const remaining = recruitOrder.count - delivered
    return {
      units: units.plus(recruitOrder.unit, delivered),
      recruitOrder: {
        ...recruitOrder,
        count: remaining,
        cost: shareOf(recruitOrder.cost, remaining, recruitOrder.count),
        startedAt: Instant.fromEpochMilliseconds(
          recruitOrder.startedAt.epochMilliseconds +
            delivered * recruitOrder.perUnitSeconds * MILLISECONDS_PER_SECOND,
        ),
      },
    }
  }

  unitCountsAt(at: Instant): FiefUnitCounts {
    const { recruitOrder } = this
    if (recruitOrder.kind === 'idle') {
      return this.units
    }
    return this.units.plus(recruitOrder.unit, deliveredUnitsOf(recruitOrder, at))
  }

  private refuseBusyMarchSlot(): Result<void, DomainError> {
    return this.march.kind === 'away' ? err({ kind: 'MarchSlotBusy' }) : ok(undefined)
  }

  private refuseAbsentUnits(units: UnitCountsByKind, now: Instant): Result<void, DomainError> {
    const atHome = this.unitsAtHomeAt(now)
    const shortUnit = unitKinds.find((unit) => units[unit] > atHome.countOf(unit))
    if (shortUnit === undefined) {
      return ok(undefined)
    }
    return err({
      kind: 'NotEnoughUnitsAtHome',
      unit: shortUnit,
      count: units[shortUnit],
      atHome: atHome.countOf(shortUnit),
    })
  }

  private oneWaySecondsTo(
    province: number,
    plot: number,
    units: UnitCountsByKind,
    terms: MarchTerms,
    roadPercent: number,
  ): number {
    return marchOneWaySeconds(
      this.coordinates,
      { kingdom: this.coordinates.kingdom, province, plot },
      units,
      terms,
      roadPercent,
    )
  }

  unitsAtHomeAt(at: Instant): FiefUnitCounts {
    const units = this.unitCountsAt(at)
    const { march } = this
    if (march.kind === 'idle') {
      return units
    }
    return unitKinds.reduce((atHome, unit) => atHome.minus(unit, march.units[unit]), units)
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
      change.march ?? this.march,
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
