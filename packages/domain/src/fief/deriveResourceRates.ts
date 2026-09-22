import type { DomainError } from '../DomainError'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import { err, ok, type Result } from '../Result'
import type { ResourceKind } from '../resources/Resources'
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

export const deriveResourceRates = (
  buildingLevels: FiefBuildingLevels,
  terrain: Terrain,
  catalog: BuildingCatalog,
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
  const rates: Record<ResourceKind, number> = {
    wood: baseRates.wood + wood.value,
    stone: baseRates.stone + stone.value,
    iron: baseRates.iron + iron.value,
    gold: baseRates.gold,
    food: baseRates.food + food.value,
  }

  const bonus = terrainBonus[terrain]
  rates[bonus.resource] += bonus.ratePerHour

  return ok(rates)
}
