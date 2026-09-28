import { BuildingKindSchema, type FiefOverview } from '@mygame/contracts'
import {
  type ArtKind,
  artLevelInForce,
  type BuildingCatalog,
  type BuildingKind,
  type BuildSlot,
  type DomainError,
  derivePeasantCounts,
  derivePeasantsForUpgrade,
  deriveResourceRates,
  deriveStudyDurationSeconds,
  deriveWarehouseCapacity,
  err,
  type Fief,
  type FiefBuildingLevels,
  type Instant,
  nextArtLevelOf,
  ok,
  type ResourceKind,
  type Result,
  type Stocks,
  type StudySlot,
  scheduleBuildQueue,
} from '@mygame/domain'

const isoOf = (instant: Instant): string => new Date(instant.epochMilliseconds).toISOString()

const slotOf = (slot: BuildSlot): FiefOverview['slot'] =>
  slot.kind === 'idle'
    ? { kind: 'idle' }
    : {
        kind: 'busy',
        building: slot.building,
        targetLevel: slot.targetLevel,
        startedAt: isoOf(slot.startedAt),
        finishesAt: isoOf(slot.finishesAt),
      }

const studyOf = (studySlot: StudySlot): FiefOverview['study'] =>
  studySlot.kind === 'idle'
    ? { kind: 'idle' }
    : {
        kind: 'busy',
        art: studySlot.art,
        targetLevel: studySlot.targetLevel,
        startedAt: isoOf(studySlot.startedAt),
        finishesAt: isoOf(studySlot.finishesAt),
      }

type ArtState = FiefOverview['arts'][ArtKind]

const resourceRaisedBy = (
  art: ArtKind,
  catalog: BuildingCatalog,
): Result<ResourceKind, DomainError> => {
  const firstLevel = catalog.artLevelOf(art, 1)
  if (firstLevel === undefined || firstLevel.art !== art) {
    return err({ kind: 'UnknownArtLevel', art, level: 1 })
  }
  return ok(firstLevel.resource)
}

const artStateOf = (
  art: ArtKind,
  fief: Fief,
  catalog: BuildingCatalog,
): Result<ArtState, DomainError> => {
  const level = fief.artLevels[art]
  const inForce = artLevelInForce(art, level, catalog)
  if (!inForce.ok) {
    return inForce
  }
  const resource = resourceRaisedBy(art, catalog)
  if (!resource.ok) {
    return resource
  }
  const ratePercent = inForce.value?.ratePercent ?? 0
  const next = nextArtLevelOf(art, level, catalog)
  if (next === undefined) {
    return ok({ level, resource: resource.value, ratePercent, nextLevel: null })
  }
  return ok({
    level,
    resource: resource.value,
    ratePercent,
    nextLevel: {
      level: next.level,
      cost: { ...next.cost },
      durationSeconds: deriveStudyDurationSeconds(
        next.durationSeconds,
        fief.buildingLevels.library,
      ),
      requiredLibraryLevel: next.requiredLibraryLevel,
      ratePercent: next.ratePercent,
    },
  })
}

const artsOf = (
  fief: Fief,
  catalog: BuildingCatalog,
): Result<FiefOverview['arts'], DomainError> => {
  const smithing = artStateOf('smithing', fief, catalog)
  if (!smithing.ok) {
    return smithing
  }
  const masonry = artStateOf('masonry', fief, catalog)
  if (!masonry.ok) {
    return masonry
  }
  return ok({ smithing: smithing.value, masonry: masonry.value })
}

const queueOf = (
  fief: Fief,
  catalog: BuildingCatalog,
): Result<FiefOverview['queue'], DomainError> => {
  const scheduled = scheduleBuildQueue(fief.slot, fief.buildQueue)
  if (!scheduled.ok) {
    return scheduled
  }
  return ok({
    entries: scheduled.value.map(({ building, targetLevel, startsAt, finishesAt }) => ({
      building,
      targetLevel,
      startsAt: isoOf(startsAt),
      finishesAt: isoOf(finishesAt),
    })),
    cap: catalog.fiefSettings().buildQueueCap,
  })
}

const resourcesOf = (
  stocks: Stocks,
  rates: Readonly<Record<ResourceKind, number>>,
  capacity: number,
): FiefOverview['resources'] => ({
  wood: { amount: stocks.wood, ratePerHour: rates.wood, capacity },
  stone: { amount: stocks.stone, ratePerHour: rates.stone, capacity },
  iron: { amount: stocks.iron, ratePerHour: rates.iron, capacity },
  gold: { amount: stocks.gold, ratePerHour: rates.gold, capacity },
  food: { amount: stocks.food, ratePerHour: rates.food, capacity },
})

const peasantsOf = (
  fief: Fief,
  catalog: BuildingCatalog,
): Result<FiefOverview['peasants'], DomainError> => {
  const built = derivePeasantCounts(fief.buildingLevels, catalog)
  if (!built.ok) {
    return built
  }
  const projected = derivePeasantCounts(fief.projectedBuildingLevels, catalog)
  if (!projected.ok) {
    return projected
  }
  return ok({
    ...built.value,
    projectedSupplied: projected.value.supplied,
    projectedOccupied: projected.value.occupied,
    projectedFree: projected.value.free,
  })
}

type BuildingState = FiefOverview['buildings'][BuildingKind]

const nextLevelOf = (
  building: BuildingKind,
  buildingLevels: FiefBuildingLevels,
  catalog: BuildingCatalog,
): Result<BuildingState['nextLevel'], DomainError> => {
  const next = catalog.levelOf(building, buildingLevels[building] + 1)
  if (next === undefined) {
    return ok(null)
  }
  const peasants = derivePeasantsForUpgrade(buildingLevels, building, next.level, catalog)
  if (!peasants.ok) {
    return peasants
  }
  const { level, cost, durationSeconds } = next
  return ok({ level, cost: { ...cost }, durationSeconds, peasants: peasants.value })
}

const buildingsOf = (
  fief: Fief,
  catalog: BuildingCatalog,
): Result<FiefOverview['buildings'], DomainError> => {
  const { buildingLevels, projectedBuildingLevels } = fief
  const buildings: Record<BuildingKind, BuildingState> = {
    sawmill: { level: buildingLevels.sawmill, nextLevel: null },
    quarry: { level: buildingLevels.quarry, nextLevel: null },
    ironMine: { level: buildingLevels.ironMine, nextLevel: null },
    farm: { level: buildingLevels.farm, nextLevel: null },
    warehouse: { level: buildingLevels.warehouse, nextLevel: null },
    library: { level: buildingLevels.library, nextLevel: null },
  }
  for (const building of BuildingKindSchema.options) {
    const nextLevel = nextLevelOf(building, projectedBuildingLevels, catalog)
    if (!nextLevel.ok) {
      return nextLevel
    }
    buildings[building] = { ...buildings[building], nextLevel: nextLevel.value }
  }
  return ok(buildings)
}

export const fiefOverviewOf = (
  fief: Fief,
  catalog: BuildingCatalog,
): Result<FiefOverview, DomainError> => {
  const rates = deriveResourceRates(fief.buildingLevels, fief.artLevels, fief.terrain, catalog)
  if (!rates.ok) {
    return rates
  }
  const capacity = deriveWarehouseCapacity(fief.buildingLevels.warehouse, catalog)
  if (!capacity.ok) {
    return capacity
  }
  const peasants = peasantsOf(fief, catalog)
  if (!peasants.ok) {
    return peasants
  }
  const buildings = buildingsOf(fief, catalog)
  if (!buildings.ok) {
    return buildings
  }
  const queue = queueOf(fief, catalog)
  if (!queue.ok) {
    return queue
  }
  const arts = artsOf(fief, catalog)
  if (!arts.ok) {
    return arts
  }
  const { kingdom, province, plot } = fief.coordinates
  return ok({
    name: fief.name.value,
    coordinates: { kingdom, province, plot },
    terrain: fief.terrain,
    resources: resourcesOf(fief.stocks, rates.value, capacity.value),
    buildings: buildings.value,
    peasants: peasants.value,
    slot: slotOf(fief.slot),
    queue: queue.value,
    study: studyOf(fief.studySlot),
    arts: arts.value,
    readAt: isoOf(fief.storedAt),
  })
}
