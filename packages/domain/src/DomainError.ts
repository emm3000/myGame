import type { Coordinates } from './fief/Coordinates'
import type { Stocks } from './fief/Fief'
import type { FiefId } from './fief/FiefId'
import type { LessonId, WordId } from './learning/Lesson'
import type { AwayMarch } from './march/March'
import type { PlayerId } from './player/PlayerId'
import type { ArtKind, BuildingKind, UnitKind } from './ports/BuildingCatalog'
import type { ResourceKind } from './resources/Resources'
import type { Instant } from './time/Instant'
import type { BuildingKind as TownBuildingKind } from './town/BuildingKind'
import type { ResourceKind as TownResourceKind } from './town/ResourceKind'
import type { SiteAddress } from './town/SiteAddress'

export type DomainError =
  | { readonly kind: 'NegativeDuration'; readonly seconds: number }
  | { readonly kind: 'FractionalDuration'; readonly seconds: number }
  | { readonly kind: 'InstantBeforeStored'; readonly storedAt: Instant; readonly now: Instant }
  | {
      readonly kind: 'InvalidMemoryCard'
      readonly field: 'step' | 'stability' | 'difficulty'
      readonly value: number
    }
  | {
      readonly kind: 'UnknownMemoryStep'
      readonly state: 'learning' | 'relearning'
      readonly step: number
    }
  | {
      readonly kind: 'ReviewBeforeLastReview'
      readonly lastReviewAt: Instant
      readonly reviewedAt: Instant
    }
  | { readonly kind: 'UnknownWord'; readonly wordId: WordId }
  | { readonly kind: 'WordNotHeld'; readonly wordId: WordId }
  | { readonly kind: 'ReviewNotDue'; readonly wordId: WordId; readonly dueAt: Instant }
  | { readonly kind: 'HintOnRecognition'; readonly wordId: WordId }
  | { readonly kind: 'UnknownChoice'; readonly wordId: WordId }
  | { readonly kind: 'LessonNotFound'; readonly lessonId: LessonId }
  | { readonly kind: 'LessonAlreadyStudied'; readonly lessonId: LessonId }
  | { readonly kind: 'LessonUnderStudy'; readonly lessonId: LessonId }
  | { readonly kind: 'LessonStudyNotFound'; readonly lessonId: LessonId }
  | {
      readonly kind: 'LessonLibraryTooLow'
      readonly requiredLibraryLevel: number
      readonly libraryLevel: number
    }
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
  | { readonly kind: 'InvalidCellsPerRow'; readonly cellsPerRow: number }
  | { readonly kind: 'CoordinatesTaken'; readonly coordinates: Coordinates }
  | { readonly kind: 'BlankFiefName' }
  | { readonly kind: 'PlayerAlreadyHoldsFief'; readonly playerId: PlayerId }
  | {
      readonly kind: 'InvalidTownAddress'
      readonly region: number
      readonly area: number
      readonly site: number
    }
  | { readonly kind: 'BlankTownName' }
  | { readonly kind: 'PlayerAlreadyHoldsTown'; readonly playerId: PlayerId }
  | { readonly kind: 'SiteTaken'; readonly site: SiteAddress }
  | {
      readonly kind: 'InvalidTownStock'
      readonly resource: TownResourceKind
      readonly amount: number
    }
  | {
      readonly kind: 'InvalidTownBuildingLevel'
      readonly building: TownBuildingKind
      readonly level: number
    }
  | {
      readonly kind: 'UnknownTownBuildingLevel'
      readonly building: TownBuildingKind
      readonly level: number
    }
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
  | { readonly kind: 'FiefNotFound'; readonly fiefId: FiefId }
  | { readonly kind: 'ProvinceNotFound'; readonly province: number; readonly lastProvince: number }
  | { readonly kind: 'UnknownBuilding'; readonly building: BuildingKind }
  | { readonly kind: 'MaxLevelReached'; readonly building: BuildingKind; readonly level: number }
  | { readonly kind: 'StudySlotBusy' }
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
  | {
      readonly kind: 'StayOutOfRange'
      readonly stayHours: number
      readonly maxStayHours: number
    }
  | { readonly kind: 'InvalidMarchStay'; readonly stayHours: number }
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
  | {
      readonly kind: 'UnitUnfitForOrder'
      readonly unit: UnitKind
      readonly order: AwayMarch['order']
    }
  | { readonly kind: 'FiefCapReached'; readonly cap: number }
  | { readonly kind: 'PlotReserved'; readonly province: number; readonly plot: number }
  | { readonly kind: 'InvalidCamp'; readonly tier: number; readonly strength: number }
  | {
      readonly kind: 'InvalidLootPercent'
      readonly resource: ResourceKind
      readonly percent: number
    }
  | { readonly kind: 'EmptyCargo' }
  | { readonly kind: 'CargoAboveCarry'; readonly cargo: number; readonly carry: number }
