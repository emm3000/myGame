import type { BuildingKind } from '../building/BuildingKind'
import type { BuildingLevel } from '../building/BuildingLevel'
import type { HireKind } from '../hiring/HireKind'
import type { HireTerms } from '../hiring/HireTerms'
import type { TownSettings } from './TownSettings'

export interface TownCatalog {
  levelOf(building: BuildingKind, level: number): BuildingLevel | undefined
  hireTermsOf(hire: HireKind): HireTerms
  townSettings(): TownSettings
}
