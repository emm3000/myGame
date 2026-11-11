import type { TownOverview } from '@mygame/contracts'
import {
  accrueTown,
  type BuildingKind,
  type BuildingLevel,
  type BuildingLevels,
  buildingKinds,
  buildPercentAt,
  type DomainError,
  Duration,
  deliveredHiresOf,
  deriveBuildDurationSeconds,
  deriveHireDurationSeconds,
  derivePeople,
  deriveResourceRates,
  deriveStorageCapacity,
  type HireKind,
  type Hires,
  hirePercentAt,
  hiringEndsAt,
  type Instant,
  type MemoryTerms,
  nextStepOf,
  noHires,
  ok,
  type ResourceKind,
  type Result,
  requiredOfficeLevelOf,
  seasonAt,
  type Town,
  type TownCatalog,
  townLabelOf,
  type WaitingList,
} from '@mygame/domain'
import { isoOf } from '../http/isoOf'
import type { LessonLibrary } from '../learning/LessonLibrary'
import { nextDueAtOf } from '../learning/reviewsOf'
import { schoolOverviewOf } from '../learning/schoolOverviewOf'
import { jobStateOf } from './jobStateOf'
import type { TownReading } from './TownReading'

type BuildingState = TownOverview['buildings'][BuildingKind]

type BuildingWork = TownOverview['work']['waitingList'][number]

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
  const stockOf = (resource: ResourceKind): TownOverview['stocks'][ResourceKind] => ({
    amount: accrual.value.stocks[resource],
    ratePerHour: rates.value[resource],
    capacity: capacity.value,
  })
  return ok({
    money: stockOf('money'),
    food: stockOf('food'),
    power: stockOf('power'),
    material: stockOf('material'),
  })
}

const peopleForWorkOf = (
  projected: BuildingLevels,
  next: BuildingLevel,
  catalog: TownCatalog,
): Result<number, DomainError> => {
  const before = derivePeople(projected, noHires, catalog)
  if (!before.ok) {
    return before
  }
  const after = derivePeople({ ...projected, [next.building]: next.level }, noHires, catalog)
  if (!after.ok) {
    return after
  }
  return ok(after.value.occupied - before.value.occupied)
}

const nextLevelOf = (
  building: BuildingKind,
  projected: BuildingLevels,
  catalog: TownCatalog,
  buildPercent: number,
): Result<BuildingState['nextLevel'], DomainError> => {
  const next = catalog.levelOf(building, projected[building] + 1)
  if (next?.building !== building) {
    return ok(null)
  }
  const people = peopleForWorkOf(projected, next, catalog)
  if (!people.ok) {
    return people
  }
  return ok({
    level: next.level,
    cost: { ...next.cost },
    durationSeconds: deriveBuildDurationSeconds(next.durationSeconds, buildPercent),
    people: people.value,
  })
}

const buildingsOf = (
  { town, at }: TownReading,
  catalog: TownCatalog,
): Result<TownOverview['buildings'], DomainError> => {
  const levels = town.buildingLevels
  const buildings: Record<BuildingKind, BuildingState> = {
    homes: { level: levels.homes, nextLevel: null },
    farm: { level: levels.farm, nextLevel: null },
    factory: { level: levels.factory, nextLevel: null },
    powerStation: { level: levels.powerStation, nextLevel: null },
    storage: { level: levels.storage, nextLevel: null },
    school: { level: levels.school, nextLevel: null },
    office: { level: levels.office, nextLevel: null },
  }
  const buildPercent = buildPercentAt(at, catalog.townSettings())
  for (const building of buildingKinds) {
    const nextLevel = nextLevelOf(building, town.projectedLevels, catalog, buildPercent)
    if (!nextLevel.ok) {
      return nextLevel
    }
    buildings[building] = { ...buildings[building], nextLevel: nextLevel.value }
  }
  return ok(buildings)
}

const scheduledWaitingListOf = (
  slotFinishesAt: Instant,
  waitingList: WaitingList,
): Result<Array<BuildingWork>, DomainError> => {
  const scheduled: Array<BuildingWork> = []
  let startsAt = slotFinishesAt
  for (const { building, level, cost, durationSeconds } of waitingList) {
    const duration = Duration.ofSeconds(durationSeconds)
    if (!duration.ok) {
      return duration
    }
    const finishesAt = startsAt.plus(duration.value)
    scheduled.push({
      building,
      level,
      cost: { ...cost },
      startsAt: isoOf(startsAt),
      finishesAt: isoOf(finishesAt),
    })
    startsAt = finishesAt
  }
  return ok(scheduled)
}

const workOf = (town: Town, catalog: TownCatalog): Result<TownOverview['work'], DomainError> => {
  const cap = catalog.townSettings().waitingListCap
  const slot = town.workSlot
  if (slot.kind === 'idle') {
    return ok({ slot: null, waitingList: [], cap })
  }
  const { building, level, cost, startedAt, finishesAt } = slot
  const waitingList = scheduledWaitingListOf(finishesAt, town.waitingList)
  if (!waitingList.ok) {
    return waitingList
  }
  return ok({
    slot: {
      building,
      level,
      cost: { ...cost },
      startsAt: isoOf(startedAt),
      finishesAt: isoOf(finishesAt),
    },
    waitingList: waitingList.value,
    cap,
  })
}

const seasonOf = (at: Instant, catalog: TownCatalog): TownOverview['season'] => {
  const season = seasonAt(at, catalog.townSettings())
  return season === undefined
    ? null
    : { kind: season.kind, year: season.year, endsAt: isoOf(season.endsAt) }
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

type HireTermsState = TownOverview['hiring']['terms'][HireKind]

const hireTermsOf = (
  hire: HireKind,
  town: Town,
  catalog: TownCatalog,
  at: Instant,
): HireTermsState => {
  const { cost, durationSeconds, people } = catalog.hireTermsOf(hire)
  return {
    cost: { ...cost },
    secondsPerHire: deriveHireDurationSeconds(
      durationSeconds,
      town.buildingLevels.office,
      hirePercentAt(at, catalog.townSettings()),
    ),
    people,
    requiredOfficeLevel: requiredOfficeLevelOf(hire, catalog),
  }
}

const hiringOrderOf = (town: Town, at: Instant): TownOverview['hiring']['order'] => {
  const slot = town.hiringSlot
  if (slot.kind === 'idle') {
    return null
  }
  const { hire, count, secondsPerHire, startedAt } = slot
  return {
    hire,
    count,
    delivered: deliveredHiresOf(slot, at),
    secondsPerHire,
    startedAt: isoOf(startedAt),
    endsAt: isoOf(hiringEndsAt(slot)),
  }
}

const hiringOf = ({ town, at }: TownReading, catalog: TownCatalog): TownOverview['hiring'] => {
  const hires = town.hiresAt(at)
  return {
    order: hiringOrderOf(town, at),
    hires: { worker: hires.worker, truck: hires.truck },
    terms: {
      worker: hireTermsOf('worker', town, catalog, at),
      truck: hireTermsOf('truck', town, catalog, at),
    },
  }
}

const guidanceOf = (
  reading: TownReading,
  catalog: TownCatalog,
  lessons: LessonLibrary,
  memoryTerms: MemoryTerms,
): Result<Pick<TownOverview, 'nextStep' | 'nextDueAt'>, DomainError> => {
  const step = nextStepOf(reading, { lessons: lessons.lessons(), memoryTerms, catalog })
  if (!step.ok) {
    return step
  }
  const nextDueAt = nextDueAtOf(reading.cards, reading.at, memoryTerms)
  if (!nextDueAt.ok) {
    return nextDueAt
  }
  return ok({
    nextStep:
      step.value.kind === 'reviews'
        ? { ...step.value, readFirst: [...step.value.readFirst] }
        : step.value,
    nextDueAt: nextDueAt.value === null ? null : isoOf(nextDueAt.value),
  })
}

export const townOverviewOf = (
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
  const buildings = buildingsOf(reading, catalog)
  if (!buildings.ok) {
    return buildings
  }
  const work = workOf(town, catalog)
  if (!work.ok) {
    return work
  }
  const school = schoolOverviewOf(reading, catalog, lessons)
  if (!school.ok) {
    return school
  }
  const guidance = guidanceOf(reading, catalog, lessons, memoryTerms)
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
    hiring: hiringOf(reading, catalog),
    job: jobStateOf(town, at),
    ...school.value,
    ...guidance.value,
    readAt: isoOf(at),
  })
}
