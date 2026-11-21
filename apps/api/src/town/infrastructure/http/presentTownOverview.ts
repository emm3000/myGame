import { PlacementBandSchema, type TownOverview } from '@mygame/contracts'
import {
  accrueTown,
  type BuildingLevels,
  type DomainError,
  deriveFullAt,
  derivePeople,
  deriveResourceRates,
  deriveStorageCapacity,
  dueHoldoutChecksOf,
  type Hires,
  type Instant,
  type MemoryTerms,
  ok,
  type ResourceKind,
  type Result,
  releasedLessonsOf,
  retainedWordCountOf,
  stableWordCountOf,
  type TownCatalog,
  townLabelOf,
  townSeasonAt,
} from '@mygame/domain'
import { presentScaffold } from '#account/infrastructure/http/presentScaffold'
import type { LessonLibrary } from '#content/application/ports/LessonLibrary'
import { isoOf } from '#platform/infrastructure/http/isoOf'
import type { TownReading } from '../../application/TownReading'
import { presentTownBuildings } from '../../building/infrastructure/http/presentTownBuildings'
import { presentTownWork } from '../../building/infrastructure/http/presentTownWork'
import { presentTownGuidance } from '../../guidance/infrastructure/http/presentTownGuidance'
import { presentTownHiring } from '../../hiring/infrastructure/http/presentTownHiring'
import { presentTownJob } from '../../jobs/infrastructure/http/presentTownJob'
import { presentTownSchool } from '../../school/infrastructure/http/presentTownSchool'

const isoOrNullOf = (instant: Instant | null): string | null =>
  instant === null ? null : isoOf(instant)

const stocksOf = (
  { town, at }: TownReading,
  catalog: TownCatalog,
): Result<TownOverview['stocks'], DomainError> => {
  const accrual = accrueTown(town, catalog, at)
  if (!accrual.ok) {
    return accrual
  }
  const rates = deriveResourceRates(town.buildingLevels, town.terrain, town.skills, catalog, at)
  if (!rates.ok) {
    return rates
  }
  const capacity = deriveStorageCapacity(town.buildingLevels.storage, catalog)
  if (!capacity.ok) {
    return capacity
  }
  const fullAt = deriveFullAt(town, catalog)
  if (!fullAt.ok) {
    return fullAt
  }
  const stockOf = (resource: ResourceKind): TownOverview['stocks'][ResourceKind] => ({
    amount: accrual.value.stocks[resource],
    ratePerHour: rates.value[resource],
    capacity: capacity.value,
    fullAt: isoOrNullOf(fullAt.value[resource]),
  })
  return ok({
    money: stockOf('money'),
    food: stockOf('food'),
    power: stockOf('power'),
    material: stockOf('material'),
  })
}

const seasonOf = (at: Instant, catalog: TownCatalog): TownOverview['season'] => {
  const season = townSeasonAt(at, catalog.townSettings())
  return season === undefined
    ? null
    : {
        kind: season.kind,
        year: season.year,
        endsAt: isoOf(season.endsAt),
        productionPercent: { ...season.productionPercent },
        durationPercent: { ...season.durationPercent },
      }
}

const peopleOf = (
  levels: BuildingLevels,
  hires: Hires,
  catalog: TownCatalog,
): Result<TownOverview['people'], DomainError> => {
  const people = derivePeople(levels, hires, catalog)
  if (!people.ok) {
    return people
  }
  const { supplied, free, occupied } = people.value
  return ok({ supplied, free, atWork: occupied })
}

export const presentTownOverview = (
  reading: TownReading,
  catalog: TownCatalog,
  lessons: LessonLibrary,
  memoryTerms: MemoryTerms,
): Result<TownOverview, DomainError> => {
  const { town, at } = reading
  const stocks = stocksOf(reading, catalog)
  if (!stocks.ok) {
    return stocks
  }
  const people = peopleOf(town.buildingLevels, town.staffedHires, catalog)
  if (!people.ok) {
    return people
  }
  const label = townLabelOf(town.buildingLevels, catalog)
  if (!label.ok) {
    return label
  }
  const buildings = presentTownBuildings(reading, catalog)
  if (!buildings.ok) {
    return buildings
  }
  const work = presentTownWork(town, catalog)
  if (!work.ok) {
    return work
  }
  const released = releasedLessonsOf(reading.bandStarts, reading.cards, {
    lessons,
    bands: lessons,
  })
  const school = presentTownSchool(reading, catalog, lessons, released, memoryTerms)
  if (!school.ok) {
    return school
  }
  const guidance = presentTownGuidance(reading, released, catalog, lessons, memoryTerms)
  if (!guidance.ok) {
    return guidance
  }
  const { region, area, site } = town.address
  return ok({
    name: town.name.value,
    label: label.value,
    site: { region, area, site },
    terrain: town.terrain,
    season: seasonOf(at, catalog),
    stocks: stocks.value,
    people: people.value,
    buildings: buildings.value,
    work: work.value,
    hiring: presentTownHiring(reading, catalog),
    job: presentTownJob(town, at),
    ...school.value,
    dueHoldoutChecks: dueHoldoutChecksOf(reading.bandStarts, at).map(({ band, week }) => ({
      band: PlacementBandSchema.parse(band),
      week,
    })),
    stableWordCount: stableWordCountOf(reading.cards),
    retainedWordCount: retainedWordCountOf(reading.cards),
    ...guidance.value,
    ...presentScaffold(reading),
    readAt: isoOf(at),
  })
}
