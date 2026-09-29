import type { Terrain } from '../fief/Terrain'
import type { ResourceKind } from '../resources/Resources'
import type { SeasonCalendar } from '../season/SeasonCalendar'

export type BuildingKind =
  | 'sawmill'
  | 'quarry'
  | 'ironMine'
  | 'farm'
  | 'warehouse'
  | 'library'
  | 'barracks'

export type ArtKind = 'smithing' | 'masonry'

export type UnitKind = 'infantry'

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

export type BarracksLevel = BuildingLevelData & {
  readonly building: 'barracks'
}

export type BuildingLevel =
  | ProducerLevel
  | FarmLevel
  | WarehouseLevel
  | LibraryLevel
  | BarracksLevel

export type ArtLevel = {
  readonly art: ArtKind
  readonly level: number
  readonly cost: Readonly<Record<ResourceKind, number>>
  readonly durationSeconds: number
  readonly requiredLibraryLevel: number
  readonly resource: ResourceKind
  readonly ratePercent: number
}

export type UnitTerms = {
  readonly cost: Readonly<Record<ResourceKind, number>>
  readonly durationSeconds: number
  readonly peasantOccupancy: number
}

export type ForageTerms = {
  readonly secondsPerProvince: number
  readonly secondsPerPlot: number
  readonly carryPerInfantry: number
  readonly maxStayHours: number
  readonly yieldPerHour: Readonly<Record<Terrain, Readonly<Record<ResourceKind, number>>>>
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
  readonly units: Readonly<Record<UnitKind, UnitTerms>>
  readonly forage: ForageTerms
}

export interface BuildingCatalog {
  levelOf(building: BuildingKind, level: number): BuildingLevel | undefined
  artLevelOf(art: ArtKind, level: number): ArtLevel | undefined
  fiefSettings(): FiefSettings
}
