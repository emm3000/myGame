import type { BuildingKind } from './BuildingKind'
import type { BuildingLevel } from './BuildingLevel'
import type { TownSettings } from './TownSettings'

export interface TownCatalog {
  levelOf(building: BuildingKind, level: number): BuildingLevel | undefined
  townSettings(): TownSettings
}
