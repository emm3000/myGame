import type { BuildingKind } from './BuildingKind'
import type { BuildingLevel } from './BuildingLevel'
import type { HireKind } from './HireKind'
import type { HireTerms } from './HireTerms'
import type { TownSettings } from './TownSettings'

export interface TownCatalog {
  levelOf(building: BuildingKind, level: number): BuildingLevel | undefined
  hireTermsOf(hire: HireKind): HireTerms
  townSettings(): TownSettings
}
