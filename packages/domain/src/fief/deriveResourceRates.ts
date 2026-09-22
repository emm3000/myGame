import type { DomainError } from '../DomainError'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import { err, ok, type Result } from '../Result'
import type { ResourceKind } from '../resources/Resources'
import type { FiefBuildingLevels } from './FiefBuildingLevels'
import type { Terrain } from './Terrain'

type ProducingBuilding = 'sawmill' | 'quarry' | 'ironMine' | 'farm'

const PRODUCERS: ReadonlyArray<{
  readonly building: ProducingBuilding
  readonly resource: ResourceKind
}> = [
  { building: 'sawmill', resource: 'wood' },
  { building: 'quarry', resource: 'stone' },
  { building: 'ironMine', resource: 'iron' },
  { building: 'farm', resource: 'food' },
]

const producerRate = (
  catalog: BuildingCatalog,
  building: ProducingBuilding,
  level: number,
): Result<number, DomainError> => {
  if (level === 0) {
    return ok(0)
  }
  const found = catalog.levelOf(building, level)
  if (found === undefined) {
    return err({ kind: 'UnknownBuildingLevel', building, level })
  }
  return ok(found.ratePerHour)
}

export const deriveResourceRates = (
  buildingLevels: FiefBuildingLevels,
  terrain: Terrain,
  catalog: BuildingCatalog,
): Result<Readonly<Record<ResourceKind, number>>, DomainError> => {
  const rates: Record<ResourceKind, number> = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

  for (const producer of PRODUCERS) {
    const rate = producerRate(catalog, producer.building, buildingLevels[producer.building])
    if (!rate.ok) {
      return rate
    }
    rates[producer.resource] = rate.value
  }

  const bonus = catalog.fiefSettings().terrainBonus[terrain]
  rates[bonus.resource] += bonus.ratePerHour

  return ok(rates)
}
