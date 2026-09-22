import type { PlayerId } from './player/PlayerId'
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
  | {
      readonly kind: 'NegativeFreePeasants'
      readonly suppliedPeasants: number
      readonly occupiedPeasants: number
    }
  | {
      readonly kind: 'InvalidCoordinates'
      readonly kingdom: number
      readonly province: number
      readonly plot: number
    }
  | { readonly kind: 'InvalidPlotsPerProvince'; readonly plotsPerProvince: number }
  | { readonly kind: 'BlankFiefName' }
  | { readonly kind: 'PlayerAlreadyHoldsFief'; readonly playerId: PlayerId }
