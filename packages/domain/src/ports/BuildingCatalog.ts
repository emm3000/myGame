import type { Terrain } from '../fief/Terrain'
import type { ResourceKind } from '../resources/Resources'
import type { SeasonCalendar } from '../season/SeasonCalendar'

export type BuildingKind = 'sawmill' | 'quarry' | 'ironMine' | 'farm' | 'warehouse' | 'library'

export type ArtKind = 'smithing' | 'masonry'

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

export type LibraryLevel = BuildingLevelData & {
  readonly building: 'library'
}

export type BuildingLevel = ProducerLevel | FarmLevel | WarehouseLevel | LibraryLevel

export type ArtLevel = {
  readonly art: ArtKind
  readonly level: number
  readonly cost: Readonly<Record<ResourceKind, number>>
  readonly durationSeconds: number
  readonly requiredLibraryLevel: number
  readonly resource: ResourceKind
  readonly ratePercent: number
}

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
  readonly buildQueueCap: number
  readonly seasons: SeasonCalendar
}

export interface BuildingCatalog {
  levelOf(building: BuildingKind, level: number): BuildingLevel | undefined
  artLevelOf(art: ArtKind, level: number): ArtLevel | undefined
  fiefSettings(): FiefSettings
}
