import type { Coordinates } from './fief/Coordinates'
import type { Stocks } from './fief/Fief'
import type { PlayerId } from './player/PlayerId'
import type { ArtKind, BuildingKind, UnitKind } from './ports/BuildingCatalog'
import type { Instant } from './time/Instant'

export type DomainError =
  | { readonly kind: 'NegativeDuration'; readonly seconds: number }
  | { readonly kind: 'FractionalDuration'; readonly seconds: number }
  | { readonly kind: 'InstantBeforeStored'; readonly storedAt: Instant; readonly now: Instant }
  | { readonly kind: 'NegativeResourceAmount'; readonly amount: number }
  | { readonly kind: 'NegativeResourceRate'; readonly ratePerHour: number }
  | {
      readonly kind: 'UnknownBuildingLevel'
      readonly building: BuildingKind
      readonly level: number
    }
  | { readonly kind: 'UnknownArtLevel'; readonly art: ArtKind; readonly level: number }
  | { readonly kind: 'InvalidArtLevel'; readonly art: ArtKind; readonly level: number }
  | { readonly kind: 'InvalidUnitCount'; readonly unit: UnitKind; readonly count: number }
  | { readonly kind: 'InvalidUnitDuration'; readonly unit: UnitKind; readonly seconds: number }
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
  | { readonly kind: 'CoordinatesTaken'; readonly coordinates: Coordinates }
  | { readonly kind: 'BlankFiefName' }
  | { readonly kind: 'PlayerAlreadyHoldsFief'; readonly playerId: PlayerId }
  | { readonly kind: 'InsufficientResources'; readonly missing: Stocks }
  | {
      readonly kind: 'NotEnoughPeasants'
      readonly requiredPeasants: number
      readonly freePeasants: number
    }
  | { readonly kind: 'QueueFull'; readonly cap: number }
  | {
      readonly kind: 'UpgradeNotFound'
      readonly building: BuildingKind
      readonly targetLevel: number
    }
  | {
      readonly kind: 'InvalidBuildingLevel'
      readonly building: BuildingKind
      readonly level: number
    }
  | {
      readonly kind: 'SlotFinishesBeforeStored'
      readonly storedAt: Instant
      readonly finishesAt: Instant
    }
  | {
      readonly kind: 'SlotStartsAfterFinish'
      readonly startedAt: Instant
      readonly finishesAt: Instant
    }
  | { readonly kind: 'FiefNotFound'; readonly playerId: PlayerId }
  | { readonly kind: 'ProvinceNotFound'; readonly province: number; readonly lastProvince: number }
  | { readonly kind: 'UnknownBuilding'; readonly building: BuildingKind }
  | { readonly kind: 'MaxLevelReached'; readonly building: BuildingKind; readonly level: number }
  | { readonly kind: 'StudySlotBusy'; readonly art: ArtKind }
  | {
      readonly kind: 'LibraryLevelTooLow'
      readonly requiredLibraryLevel: number
      readonly libraryLevel: number
    }
  | { readonly kind: 'ArtMaxLevelReached'; readonly art: ArtKind; readonly level: number }
  | { readonly kind: 'StudyNotFound'; readonly art: ArtKind; readonly targetLevel: number }
  | { readonly kind: 'BarracksNotBuilt' }
  | {
      readonly kind: 'BarracksTooLow'
      readonly unit: UnitKind
      readonly requiredBarracksLevel: number
      readonly barracksLevel: number
    }
  | { readonly kind: 'RecruitSlotBusy'; readonly unit: UnitKind }
  | { readonly kind: 'RecruitOrderNotFound'; readonly unit: UnitKind; readonly startedAt: Instant }
  | { readonly kind: 'StayOutOfRange'; readonly stayHours: number }
  | { readonly kind: 'MarchSlotBusy' }
  | { readonly kind: 'MarchNotFound'; readonly departedAt: Instant }
  | { readonly kind: 'MarchAlreadyReturning' }
  | { readonly kind: 'MarchTargetOutOfBounds'; readonly province: number; readonly plot: number }
  | { readonly kind: 'MarchToOwnPlot' }
  | { readonly kind: 'PlotHeld'; readonly province: number; readonly plot: number }
  | { readonly kind: 'PlotHasCamp'; readonly province: number; readonly plot: number }
  | { readonly kind: 'PlotHasNoCamp'; readonly province: number; readonly plot: number }
  | {
      readonly kind: 'NotEnoughUnitsAtHome'
      readonly unit: UnitKind
      readonly count: number
      readonly atHome: number
    }
  | { readonly kind: 'InvalidCamp'; readonly tier: number; readonly strength: number }
