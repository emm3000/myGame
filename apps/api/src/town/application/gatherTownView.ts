import {
  accrueTown,
  type DomainError,
  deriveFullAt,
  derivePeople,
  deriveResourceRates,
  deriveStorageCapacity,
  type Instant,
  type MemoryTerms,
  ok,
  type People,
  type ResourceKind,
  type Result,
  type TownCatalog,
  type TownLabel,
  townLabelOf,
} from '@mygame/domain'
import type { LessonLibrary } from '#content/application/ports/LessonLibrary'
import {
  type BuildingsView,
  gatherBuildingsView,
} from '../building/application/gatherBuildingsView'
import { gatherWorkView, type WorkView } from '../building/application/gatherWorkView'
import { gatherSchoolView, type SchoolView } from '../school/application/gatherSchoolView'
import type { TownReading } from './TownReading'

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
  readonly school: SchoolView
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

export const gatherTownView = (
  reading: TownReading,
  catalog: TownCatalog,
  lessons: LessonLibrary,
  memoryTerms: MemoryTerms,
): Result<TownView, DomainError> => {
  const { town } = reading
  const stocks = gatherStocks(reading, catalog)
  if (!stocks.ok) {
    return stocks
  }
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
  const school = gatherSchoolView(reading, catalog, lessons, memoryTerms)
  if (!school.ok) {
    return school
  }
  return ok({
    stocks: stocks.value,
    people: people.value,
    label: label.value,
    buildings: buildings.value,
    work: work.value,
    school: school.value,
  })
}
