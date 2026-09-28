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

type Percents = Record<ResourceKind, ReadonlyArray<number>>

const noPercents: Percents = { wood: [], stone: [], iron: [], gold: [], food: [] }

const withArtPercents = (
  percents: Percents,
  artLevels: FiefArtLevels,
  catalog: BuildingCatalog,
): Result<Percents, DomainError> => {
  const collected = { ...percents }
  for (const art of artKinds) {
    const inForce = artLevelInForce(art, artLevels[art], catalog)
    if (!inForce.ok) {
      return inForce
    }
    const found = inForce.value
    if (found === undefined) {
      continue
    }
    collected[found.resource] = [...collected[found.resource], 100 + found.ratePercent]
  }
  return ok(collected)
}

const withSeasonPercents = (
  percents: Percents,
  at: Instant,
  catalog: BuildingCatalog,
): Percents => {
  const settings = catalog.fiefSettings()
  const season = seasonAt(at, settings)
  if (season === undefined) {
    return percents
  }
  const inForce = settings.seasons.multiplierPercent[season.kind]
  return {
    wood: [...percents.wood, inForce.wood],
    stone: [...percents.stone, inForce.stone],
    iron: [...percents.iron, inForce.iron],
    gold: [...percents.gold, inForce.gold],
    food: [...percents.food, inForce.food],
  }
}

const scaledBy = (rate: number, percents: ReadonlyArray<number>): number =>
  (rate * percents.reduce((product, percent) => product * percent, 1)) / 100 ** percents.length

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

  const artPercents = withArtPercents(noPercents, artLevels, catalog)
  if (!artPercents.ok) {
    return artPercents
  }
  const percents = withSeasonPercents(artPercents.value, at, catalog)
  return ok({
    wood: scaledBy(rates.wood, percents.wood),
    stone: scaledBy(rates.stone, percents.stone),
    iron: scaledBy(rates.iron, percents.iron),
    gold: scaledBy(rates.gold, percents.gold),
    food: scaledBy(rates.food, percents.food),
  })
}
