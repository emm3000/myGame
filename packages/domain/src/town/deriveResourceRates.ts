import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import { seasonAt } from '../season/seasonAt'
import type { Instant } from '../time/Instant'
import type { BuildingLevels } from './BuildingLevels'
import type { ResourceKind } from './ResourceKind'
import type { Terrain } from './Terrain'
import type { TownCatalog } from './TownCatalog'
import type { TownSkill } from './TownSkill'

type ProducerBuilding = 'farm' | 'factory' | 'powerStation'

export type ResourceRates = Readonly<Record<ResourceKind, number>>

const bonusResourceOf: Readonly<Record<Terrain, ResourceKind>> = {
  fields: 'food',
  river: 'power',
  hills: 'material',
}

const producerRate = (
  building: ProducerBuilding,
  level: number,
  catalog: TownCatalog,
): Result<number, DomainError> => {
  if (level === 0) {
    return ok(0)
  }
  const found = catalog.levelOf(building, level)
  if (found?.building !== building) {
    return err({ kind: 'UnknownTownBuildingLevel', building, level })
  }
  return ok(found.ratePerHour)
}

const noSeasonBeforeEpoch: ResourceRates = { money: 100, food: 100, power: 100, material: 100 }

const seasonPercentsAt = (at: Instant, catalog: TownCatalog): ResourceRates => {
  const { seasons } = catalog.townSettings()
  const season = seasonAt(at, catalog.townSettings())
  return season === undefined ? noSeasonBeforeEpoch : seasons.productionPercent[season.kind]
}

const percentsOf = (
  resource: ResourceKind,
  skills: ReadonlyArray<TownSkill>,
  seasonPercent: number,
): ReadonlyArray<number> => {
  const earned = skills.filter((skill) => skill.resource === resource)
  if (earned.length === 0) {
    return [seasonPercent]
  }
  const skillPercent = earned.reduce((sum, skill) => sum + skill.ratePercent, 100)
  return [skillPercent, seasonPercent]
}

const scaledRate = (rate: number, percents: ReadonlyArray<number>): number =>
  (rate * percents.reduce((product, percent) => product * percent, 1)) / 100 ** percents.length

export const deriveResourceRates = (
  buildingLevels: BuildingLevels,
  terrain: Terrain,
  skills: ReadonlyArray<TownSkill>,
  catalog: TownCatalog,
  at: Instant,
): Result<ResourceRates, DomainError> => {
  const food = producerRate('farm', buildingLevels.farm, catalog)
  if (!food.ok) {
    return food
  }
  const material = producerRate('factory', buildingLevels.factory, catalog)
  if (!material.ok) {
    return material
  }
  const power = producerRate('powerStation', buildingLevels.powerStation, catalog)
  if (!power.ok) {
    return power
  }
  const { taxRatePerHour, terrainBonusPerHour } = catalog.townSettings()
  const bonus = bonusResourceOf[terrain]
  const base: ResourceRates = {
    money: taxRatePerHour,
    food: food.value,
    power: power.value,
    material: material.value,
  }
  const percents = seasonPercentsAt(at, catalog)
  const scaled = (resource: ResourceKind): number =>
    scaledRate(
      base[resource] + (resource === bonus ? terrainBonusPerHour : 0),
      percentsOf(resource, skills, percents[resource]),
    )
  return ok({
    money: scaled('money'),
    food: scaled('food'),
    power: scaled('power'),
    material: scaled('material'),
  })
}
