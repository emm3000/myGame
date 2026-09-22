import type { Terrain } from '../fief/Terrain'
import type { ResourceKind } from '../resources/Resources'

export type BuildingKind = 'sawmill' | 'quarry' | 'ironMine' | 'farm' | 'warehouse'

type BuildingLevelData = {
  readonly level: number
  readonly cost: Readonly<Record<ResourceKind, number>>
  readonly durationSeconds: number
  readonly peasantOccupancy: number
}

export type ProducerLevel = BuildingLevelData & {
  readonly building: 'sawmill' | 'quarry' | 'ironMine'
  readonly ratePerHour: number
}

export type FarmLevel = BuildingLevelData & {
  readonly building: 'farm'
  readonly ratePerHour: number
  readonly peasantSupply: number
}

export type WarehouseLevel = BuildingLevelData & {
  readonly building: 'warehouse'
  readonly capacityUnits: number
}

export type BuildingLevel = ProducerLevel | FarmLevel | WarehouseLevel

export type TerrainBonus = {
  readonly resource: ResourceKind
  readonly ratePerHour: number
}

export type FiefSettings = {
  readonly startingStocks: Readonly<Record<ResourceKind, number>>
  readonly startingCapacity: number
  readonly basePeasantSupply: number
  readonly plotsPerProvince: number
  readonly baseRates: Readonly<Record<ResourceKind, number>>
  readonly terrainBonus: Readonly<Record<Terrain, TerrainBonus>>
}

export interface BuildingCatalog {
  levelOf(building: BuildingKind, level: number): BuildingLevel | undefined
  fiefSettings(): FiefSettings
}
