import type { BuildingKind } from './ports/BuildingCatalog'
import type { Instant } from './time/Instant'

export type DomainError =
  | { readonly kind: 'NegativeDuration'; readonly seconds: number }
  | { readonly kind: 'InstantBeforeStored'; readonly storedAt: Instant; readonly now: Instant }
  | { readonly kind: 'NegativeResourceAmount'; readonly amount: number }
  | { readonly kind: 'NegativeResourceRate'; readonly ratePerHour: number }
  | {
      readonly kind: 'UnknownBuildingLevel'
      readonly building: BuildingKind
      readonly level: number
    }
