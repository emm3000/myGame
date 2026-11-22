import type { LessonLibrary, TownReading } from '@mygame/domain'
import {
  accrueTown,
  type DomainError,
  type DueHoldoutCheck,
  deriveFullAt,
  derivePeople,
  deriveResourceRates,
  deriveStorageCapacity,
  dueHoldoutChecksOf,
  type Instant,
  type MemoryTerms,
  ok,
  type People,
  type ResourceKind,
  type Result,
  retainedWordCountOf,
  stableWordCountOf,
  type TownCatalog,
  type TownLabel,
  type TownSeason,
  townLabelOf,
  townSeasonAt,
} from '@mygame/domain'
import {
  type BuildingsView,
  gatherBuildingsView,
} from '../../building/application/gatherBuildingsView'
import { gatherWorkView, type WorkView } from '../../building/application/gatherWorkView'
import {
  type GuidanceView,
  gatherGuidanceView,
} from '../../guidance/application/gatherGuidanceView'
import { gatherSchoolView, type SchoolView } from '../../school/application/gatherSchoolView'

export type StockView = {
  readonly amount: number
  readonly ratePerHour: number
  readonly capacity: number
  readonly fullAt: Instant | null
}

export type TownView = {
  readonly stocks: Readonly<Record<ResourceKind, StockView>>
  readonly people: People
  readonly label: TownLabel
  readonly buildings: BuildingsView
  readonly work: WorkView
  readonly season: TownSeason | null
  readonly school: SchoolView
  readonly guidance: GuidanceView
  readonly dueHoldoutChecks: ReadonlyArray<DueHoldoutCheck>
  readonly stableWordCount: number
  readonly retainedWordCount: number
}

const gatherStocks = (
  { town, at }: TownReading,
  catalog: TownCatalog,
): Result<TownView['stocks'], DomainError> => {
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
  const stockOf = (resource: ResourceKind): StockView => ({
    amount: accrual.value.stocks[resource],
    ratePerHour: rates.value[resource],
    capacity: capacity.value,
    fullAt: fullAt.value[resource],
  })
  return ok({
    money: stockOf('money'),
    food: stockOf('food'),
    power: stockOf('power'),
    material: stockOf('material'),
  })
}

const gatherBuildingsAndPeople = (
  reading: TownReading,
  catalog: TownCatalog,
): Result<Pick<TownView, 'people' | 'label' | 'buildings' | 'work'>, DomainError> => {
  const { town } = reading
  const people = derivePeople(town.buildingLevels, town.staffedHires, catalog)
  if (!people.ok) {
    return people
  }
  const label = townLabelOf(town.buildingLevels, catalog)
  if (!label.ok) {
    return label
  }
  const buildings = gatherBuildingsView(reading, catalog)
  if (!buildings.ok) {
    return buildings
  }
  const work = gatherWorkView(town, catalog)
  if (!work.ok) {
    return work
  }
  return ok({
    people: people.value,
    label: label.value,
    buildings: buildings.value,
    work: work.value,
  })
}

export const gatherTownView = (
  reading: TownReading,
  catalog: TownCatalog,
  lessons: LessonLibrary,
  memoryTerms: MemoryTerms,
): Result<TownView, DomainError> => {
  const { at, bandStarts, cards } = reading
  const stocks = gatherStocks(reading, catalog)
  if (!stocks.ok) {
    return stocks
  }
  const buildingsAndPeople = gatherBuildingsAndPeople(reading, catalog)
  if (!buildingsAndPeople.ok) {
    return buildingsAndPeople
  }
  const school = gatherSchoolView(reading, catalog, lessons, memoryTerms)
  if (!school.ok) {
    return school
  }
  const released = school.value.releasedLessons.map(({ lesson }) => lesson)
  const guidance = gatherGuidanceView(reading, released, catalog, lessons, memoryTerms)
  if (!guidance.ok) {
    return guidance
  }
  return ok({
    ...buildingsAndPeople.value,
    stocks: stocks.value,
    season: townSeasonAt(at, catalog.townSettings()) ?? null,
    school: school.value,
    guidance: guidance.value,
    dueHoldoutChecks: dueHoldoutChecksOf(bandStarts, at),
    stableWordCount: stableWordCountOf(cards),
    retainedWordCount: retainedWordCountOf(cards),
  })
}
