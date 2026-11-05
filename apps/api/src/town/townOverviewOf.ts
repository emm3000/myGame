import type { TownOverview } from '@mygame/contracts/town'
import {
  type DomainError,
  deriveBuildDurationSeconds,
  Instant,
  ok,
  type Result,
  seasonAt,
} from '@mygame/domain'
import {
  accrueTown,
  type BuildingKind,
  type BuildingLevel,
  type BuildingLevels,
  buildingKinds,
  buildPercentAt,
  derivePeople,
  deriveResourceRates,
  deriveStorageCapacity,
  type ResourceKind,
  type Town,
  type TownCatalog,
  townLabelOf,
  type WaitingList,
} from '@mygame/domain/town'
import { isoOf } from '../http/isoOf'
import type { TownReading } from './TownReading'

type BuildingState = TownOverview['buildings'][BuildingKind]

type BuildingWork = TownOverview['work']['waitingList'][number]

const MILLISECONDS_PER_SECOND = 1000

const stocksOf = (
  { town, at }: TownReading,
  catalog: TownCatalog,
): Result<TownOverview['stocks'], DomainError> => {
  const accrual = accrueTown(town, catalog, at)
  if (!accrual.ok) {
    return accrual
  }
  const rates = deriveResourceRates(town.buildingLevels, town.terrain, catalog, at)
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
  const before = derivePeople(projected, catalog)
  if (!before.ok) {
    return before
  }
  const after = derivePeople({ ...projected, [next.building]: next.level }, catalog)
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
): Array<BuildingWork> => {
  const scheduled: Array<BuildingWork> = []
  let startsAt = slotFinishesAt
  for (const { building, level, cost, durationSeconds } of waitingList) {
    const finishesAt = Instant.fromEpochMilliseconds(
      startsAt.epochMilliseconds + durationSeconds * MILLISECONDS_PER_SECOND,
    )
    scheduled.push({
      building,
      level,
      cost: { ...cost },
      startsAt: isoOf(startsAt),
      finishesAt: isoOf(finishesAt),
    })
    startsAt = finishesAt
  }
  return scheduled
}

const workOf = (town: Town, catalog: TownCatalog): TownOverview['work'] => {
  const cap = catalog.townSettings().waitingListCap
  const slot = town.workSlot
  if (slot.kind === 'idle') {
    return { slot: null, waitingList: [], cap }
  }
  const { building, level, cost, startedAt, finishesAt } = slot
  return {
    slot: {
      building,
      level,
      cost: { ...cost },
      startsAt: isoOf(startedAt),
      finishesAt: isoOf(finishesAt),
    },
    waitingList: scheduledWaitingListOf(finishesAt, town.waitingList),
    cap,
  }
}

const seasonOf = (at: Instant, catalog: TownCatalog): TownOverview['season'] => {
  const season = seasonAt(at, catalog.townSettings())
  return season === undefined
    ? null
    : { kind: season.kind, year: season.year, endsAt: isoOf(season.endsAt) }
}

export const townOverviewOf = (
  reading: TownReading,
  catalog: TownCatalog,
): Result<TownOverview, DomainError> => {
  const { town, at } = reading
  const stocks = stocksOf(reading, catalog)
  if (!stocks.ok) {
    return stocks
  }
  const people = derivePeople(town.buildingLevels, catalog)
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
  const { region, area, site } = town.address
  return ok({
    name: town.name.value,
    label: label.value,
    site: { region, area, site },
    terrain: town.terrain,
    season: seasonOf(at, catalog),
    stocks: stocks.value,
    people: {
      supplied: people.value.supplied,
      free: people.value.free,
      atWork: people.value.occupied,
    },
    buildings: buildings.value,
    work: workOf(town, catalog),
    readAt: isoOf(at),
  })
}
