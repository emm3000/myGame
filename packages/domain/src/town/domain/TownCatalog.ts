import type { BuildingKind } from '../building/domain/BuildingKind'
import type { BuildingLevel } from '../building/domain/BuildingLevel'
import type { HireKind } from '../hiring/domain/HireKind'
import type { HireTerms } from '../hiring/domain/HireTerms'
import type { TownSettings } from './TownSettings'

export interface TownCatalog {
  levelOf(building: BuildingKind, level: number): BuildingLevel | undefined
  hireTermsOf(hire: HireKind): HireTerms
  townSettings(): TownSettings
}
