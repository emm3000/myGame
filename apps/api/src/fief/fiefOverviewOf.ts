import { BuildingKindSchema, type FiefOverview } from '@mygame/contracts'
import {
  type ArtKind,
  type AwayMarch,
  artLevelInForce,
  artResourceOf,
  type BuildingCatalog,
  type BuildingKind,
  type BuildSlot,
  byUnitKind,
  type DomainError,
  type DurationPercent,
  deliveredUnitsOf,
  deriveBuildDurationSeconds,
  deriveLowestFreePeasants,
  derivePeasantCounts,
  derivePeasantsForUpgrade,
  deriveResourceRates,
  deriveStudyDurationSeconds,
  deriveUnitDurationSeconds,
  deriveWarehouseCapacity,
  durationPercentAt,
  type Fief,
  type FiefBuildingLevels,
  type Instant,
  type March,
  marchInstantsOf,
  nextArtLevelOf,
  ok,
  type RecruitOrder,
  type ResourceKind,
  type Result,
  recruitOrderEndsAt,
  type Stocks,
  type StudySlot,
  scheduleBuildQueue,
  seasonAt,
  type Terrain,
  terrainOf,
  type UnitKind,
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

const unitsOf = (fief: Fief): FiefOverview['units'] => {
  const counts = fief.unitCountsAt(fief.storedAt)
  return byUnitKind((unit) => counts.countOf(unit))
}

const recruitOrderOf = (
  recruitOrder: RecruitOrder,
  readAt: Instant,
): FiefOverview['recruitOrder'] =>
  recruitOrder.kind === 'idle'
    ? null
    : {
        unit: recruitOrder.unit,
        count: recruitOrder.count,
        delivered: deliveredUnitsOf(recruitOrder, readAt),
        perUnitSeconds: recruitOrder.perUnitSeconds,
        startedAt: isoOf(recruitOrder.startedAt),
        endsAt: isoOf(recruitOrderEndsAt(recruitOrder)),
      }

type RecruitTerms = FiefOverview['recruitTerms'][UnitKind]

type UnitStats = FiefOverview['unitTerms'][UnitKind]

const recruitTermsOf = (
  fief: Fief,
  catalog: BuildingCatalog,
  durations: DurationPercent,
): FiefOverview['recruitTerms'] => {
  const termsOf = (unit: UnitKind): RecruitTerms => {
    const { cost, durationSeconds, peasantOccupancy } = catalog.fiefSettings().units[unit]
    return {
      cost: { ...cost },
      peasants: peasantOccupancy,
      perUnitSeconds: deriveUnitDurationSeconds(
        durationSeconds,
        fief.buildingLevels.barracks,
        durations.train,
      ),
    }
  }
  return byUnitKind(termsOf)
}

type MarchState = NonNullable<FiefOverview['march']>

type OrderFields = 'order' | 'stayHours' | 'camp' | 'fought'

type MarchOrderState =
  | Pick<Extract<MarchState, { order: 'forage' }>, OrderFields>
  | Pick<Extract<MarchState, { order: 'attack' }>, OrderFields>

const marchOrderOf = (march: AwayMarch): MarchOrderState =>
  march.order === 'forage'
    ? { order: 'forage', stayHours: march.stayHours, camp: null, fought: false }
    : { order: 'attack', stayHours: 0, camp: { ...march.camp }, fought: march.fought }

const awayMarchOf = (march: AwayMarch): MarchState => {
  const { arrivesAt, leavesAt, returnsAt } = marchInstantsOf(march)
  return {
    ...marchOrderOf(march),
    province: march.province,
    plot: march.plot,
    terrain: terrainOf(march.province),
    infantry: march.infantry,
    departedAt: isoOf(march.departedAt),
    oneWaySeconds: march.oneWaySeconds,
    loot: { ...march.loot },
    arrivesAt: isoOf(arrivesAt),
    leavesAt: isoOf(leavesAt),
    returnsAt: isoOf(returnsAt),
    recalledAt: march.recalledAt === undefined ? null : isoOf(march.recalledAt),
  }
}

const marchOf = (march: March): FiefOverview['march'] =>
  march.kind === 'idle' ? null : awayMarchOf(march)

type ForageYield = FiefOverview['forageTerms']['yieldPerHour'][Terrain]

const forageTermsOf = (catalog: BuildingCatalog): FiefOverview['forageTerms'] => {
  const { secondsPerProvince, secondsPerPlot, maxStayHours, yieldPerHour } =
    catalog.fiefSettings().forage
  const yieldOf = (terrain: Terrain): ForageYield => ({ ...yieldPerHour[terrain], gold: 0 })
  return {
    secondsPerProvince,
    secondsPerPlot,
    maxStayHours,
    yieldPerHour: {
      lowlands: yieldOf('lowlands'),
      uplands: yieldOf('uplands'),
      ridges: yieldOf('ridges'),
    },
  }
}

const unitTermsOf = (catalog: BuildingCatalog): FiefOverview['unitTerms'] => {
  const statsOf = (unit: UnitKind): UnitStats => {
    const { strength, carry, roadPercent, barracksLevel } = catalog.fiefSettings().units[unit]
    return { strength, carry, roadPercent, barracksLevel }
  }
  return byUnitKind(statsOf)
}

const combatTermsOf = (catalog: BuildingCatalog): FiefOverview['combatTerms'] => {
  const { camps } = catalog.fiefSettings()
  const { 1: first, 2: second, 3: third } = camps.tiers
  return {
    lootPerStrength: camps.lootPerStrength,
    tiers: { 1: { ...first }, 2: { ...second }, 3: { ...third } },
  }
}

type ArtState = FiefOverview['arts'][ArtKind]

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
  const resource = artResourceOf(art, catalog)
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
        durationPercentAt(fief.storedAt, catalog.fiefSettings()).study,
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

const seasonOf = (
  fief: Fief,
  catalog: BuildingCatalog,
  durations: DurationPercent,
): FiefOverview['season'] => {
  const settings = catalog.fiefSettings()
  const season = seasonAt(fief.storedAt, settings)
  if (season === undefined) {
    return null
  }
  return {
    kind: season.kind,
    year: season.year,
    endsAt: isoOf(season.endsAt),
    multiplierPercent: { ...settings.seasons.multiplierPercent[season.kind] },
    durationPercent: { ...durations },
  }
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
  const built = derivePeasantCounts(fief.buildingLevels, fief.units, fief.recruitOrder, catalog)
  if (!built.ok) {
    return built
  }
  const projected = derivePeasantCounts(
    fief.projectedBuildingLevels,
    fief.units,
    fief.recruitOrder,
    catalog,
  )
  if (!projected.ok) {
    return projected
  }
  const lowestFree = deriveLowestFreePeasants(fief, catalog)
  if (!lowestFree.ok) {
    return lowestFree
  }
  return ok({
    ...built.value,
    projectedSupplied: projected.value.supplied,
    projectedOccupied: projected.value.occupied,
    projectedFree: projected.value.free,
    lowestFree: lowestFree.value,
  })
}

type BuildingState = FiefOverview['buildings'][BuildingKind]

const nextLevelOf = (
  building: BuildingKind,
  buildingLevels: FiefBuildingLevels,
  catalog: BuildingCatalog,
  buildPercent: number,
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
  return ok({
    level,
    cost: { ...cost },
    durationSeconds: deriveBuildDurationSeconds(durationSeconds, buildPercent),
    peasants: peasants.value,
  })
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
    barracks: { level: buildingLevels.barracks, nextLevel: null },
  }
  const buildPercent = durationPercentAt(fief.storedAt, catalog.fiefSettings()).build
  for (const building of BuildingKindSchema.options) {
    const nextLevel = nextLevelOf(building, projectedBuildingLevels, catalog, buildPercent)
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
  const rates = deriveResourceRates(
    fief.buildingLevels,
    fief.artLevels,
    fief.terrain,
    catalog,
    fief.storedAt,
  )
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
  const durations = durationPercentAt(fief.storedAt, catalog.fiefSettings())
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
    season: seasonOf(fief, catalog, durations),
    units: unitsOf(fief),
    recruitOrder: recruitOrderOf(fief.recruitOrder, fief.storedAt),
    recruitTerms: recruitTermsOf(fief, catalog, durations),
    unitTerms: unitTermsOf(catalog),
    march: marchOf(fief.march),
    forageTerms: forageTermsOf(catalog),
    combatTerms: combatTermsOf(catalog),
    readAt: isoOf(fief.storedAt),
  })
}
