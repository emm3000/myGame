import type { DomainError } from '../DomainError'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import { err, ok, type Result } from '../Result'
import type { ResourceKind } from '../resources/Resources'
import { seasonAt } from '../season/seasonAt'
import type { Instant } from '../time/Instant'
import { artKinds } from './artKinds'
import { artLevelInForce } from './artLevelInForce'
import type { FiefArtLevels } from './FiefArtLevels'
import type { FiefBuildingLevels } from './FiefBuildingLevels'
import type { Terrain } from './Terrain'

type RateBearingBuilding = 'sawmill' | 'quarry' | 'ironMine' | 'farm'

const producerRate = (
  catalog: BuildingCatalog,
  building: RateBearingBuilding,
  level: number,
): Result<number, DomainError> => {
  if (level === 0) {
    return ok(0)
  }
  const found = catalog.levelOf(building, level)
  if (found === undefined || found.building !== building) {
    return err({ kind: 'UnknownBuildingLevel', building, level })
  }
  return ok(found.ratePerHour)
}

type Rates = Record<ResourceKind, number>

const applyArts = (
  rates: Rates,
  artLevels: FiefArtLevels,
  catalog: BuildingCatalog,
): Result<Rates, DomainError> => {
  const multiplied = { ...rates }
  for (const art of artKinds) {
    const inForce = artLevelInForce(art, artLevels[art], catalog)
    if (!inForce.ok) {
      return inForce
    }
    const found = inForce.value
    if (found === undefined) {
      continue
    }
    multiplied[found.resource] = (multiplied[found.resource] * (100 + found.ratePercent)) / 100
  }
  return ok(multiplied)
}

const applySeason = (rates: Rates, at: Instant, catalog: BuildingCatalog): Rates => {
  const settings = catalog.fiefSettings()
  const season = seasonAt(at, settings)
  if (season === undefined) {
    return rates
  }
  const percents = settings.seasons.multiplierPercent[season.kind]
  return {
    wood: (rates.wood * percents.wood) / 100,
    stone: (rates.stone * percents.stone) / 100,
    iron: (rates.iron * percents.iron) / 100,
    gold: (rates.gold * percents.gold) / 100,
    food: (rates.food * percents.food) / 100,
  }
}

export const deriveResourceRates = (
  buildingLevels: FiefBuildingLevels,
  artLevels: FiefArtLevels,
  terrain: Terrain,
  catalog: BuildingCatalog,
  at: Instant,
): Result<Readonly<Record<ResourceKind, number>>, DomainError> => {
  const wood = producerRate(catalog, 'sawmill', buildingLevels.sawmill)
  if (!wood.ok) {
    return wood
  }
  const stone = producerRate(catalog, 'quarry', buildingLevels.quarry)
  if (!stone.ok) {
    return stone
  }
  const iron = producerRate(catalog, 'ironMine', buildingLevels.ironMine)
  if (!iron.ok) {
    return iron
  }
  const food = producerRate(catalog, 'farm', buildingLevels.farm)
  if (!food.ok) {
    return food
  }

  const { baseRates, terrainBonus } = catalog.fiefSettings()
  const rates: Rates = {
    wood: baseRates.wood + wood.value,
    stone: baseRates.stone + stone.value,
    iron: baseRates.iron + iron.value,
    gold: baseRates.gold,
    food: baseRates.food + food.value,
  }

  const bonus = terrainBonus[terrain]
  rates[bonus.resource] += bonus.ratePerHour

  const withArts = applyArts(rates, artLevels, catalog)
  if (!withArts.ok) {
    return withArts
  }
  return ok(applySeason(withArts.value, at, catalog))
}
