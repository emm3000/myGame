import type { LessonId, WordId } from './learning/Lesson'
import type { PlayerId } from './player/PlayerId'
import type { Instant } from './time/Instant'
import type { BuildingKind } from './town/BuildingKind'
import type { HireKind } from './town/HireKind'
import type { Hires } from './town/Hires'
import type { ResourceKind } from './town/ResourceKind'
import type { SiteAddress } from './town/SiteAddress'
import type { Stocks } from './town/Stocks'

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
  | { readonly kind: 'PlacementNotOffered' }
  | { readonly kind: 'PlacementAlreadyTaken' }
  | { readonly kind: 'PlacementBandNotAsked'; readonly band: number }
  | { readonly kind: 'InvalidPlacementAnswers'; readonly band: number }
  | { readonly kind: 'LessonAlreadyStudied'; readonly lessonId: LessonId }
  | { readonly kind: 'LessonUnderStudy'; readonly lessonId: LessonId }
  | { readonly kind: 'LessonStudyNotFound'; readonly lessonId: LessonId }
  | {
      readonly kind: 'LearningCapReached'
      readonly learningCap: number
      readonly cardsInLearning: number
      readonly lessonWordCount: number
    }
  | {
      readonly kind: 'LessonSchoolTooLow'
      readonly requiredSchoolLevel: number
      readonly schoolLevel: number
    }
  | { readonly kind: 'NegativeResourceAmount'; readonly amount: number }
  | { readonly kind: 'FractionalResourceAmount'; readonly amount: number }
  | { readonly kind: 'InvalidCellsPerRow'; readonly cellsPerRow: number }
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
      readonly resource: ResourceKind
      readonly amount: number
    }
  | {
      readonly kind: 'InvalidTownBuildingLevel'
      readonly building: BuildingKind
      readonly level: number
    }
  | {
      readonly kind: 'UnknownTownBuildingLevel'
      readonly building: BuildingKind
      readonly level: number
    }
  | { readonly kind: 'TownNotFound'; readonly playerId: PlayerId }
  | { readonly kind: 'WaitingListFull'; readonly cap: number }
  | {
      readonly kind: 'TopLevelReached'
      readonly building: BuildingKind
      readonly level: number
    }
  | {
      readonly kind: 'NotEnoughPeople'
      readonly requiredPeople: number
      readonly freePeople: number
    }
  | { readonly kind: 'NotEnoughResources'; readonly missing: Stocks }
  | {
      readonly kind: 'BuildingWorkNotFound'
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
  | { readonly kind: 'StudySlotBusy' }
  | { readonly kind: 'InvalidHireCount'; readonly hire: HireKind; readonly count: number }
  | {
      readonly kind: 'InvalidHireDuration'
      readonly hire: HireKind
      readonly secondsPerHire: number
    }
  | {
      readonly kind: 'OfficeTooLow'
      readonly hire: HireKind
      readonly requiredOfficeLevel: number
      readonly officeLevel: number
    }
  | { readonly kind: 'HiringSlotBusy'; readonly hire: HireKind }
  | { readonly kind: 'HiringOrderNotFound'; readonly hire: HireKind; readonly startedAt: Instant }
  | { readonly kind: 'AreaNotFound'; readonly area: number }
  | { readonly kind: 'InvalidTeam'; readonly team: Hires }
  | { readonly kind: 'JobHoursOutOfRange'; readonly hours: number; readonly maxHours: number }
  | { readonly kind: 'TeamAlreadyOut' }
  | { readonly kind: 'JobSiteOutOfBounds'; readonly area: number; readonly site: number }
  | { readonly kind: 'JobToOwnSite' }
  | { readonly kind: 'SiteHeld'; readonly area: number; readonly site: number }
  | { readonly kind: 'NotAWasteSite'; readonly area: number; readonly site: number }
  | { readonly kind: 'NoWasteYet'; readonly area: number; readonly site: number }
  | {
      readonly kind: 'NotEnoughHiresAtHome'
      readonly hire: HireKind
      readonly count: number
      readonly atHome: number
    }
  | { readonly kind: 'JobNotFound'; readonly sentAt: Instant }
  | { readonly kind: 'JobAlreadyReturning' }
  | { readonly kind: 'InvalidJobHours'; readonly hours: number }
  | {
      readonly kind: 'InvalidCleanUp'
      readonly size: number
      readonly waste: number
      readonly strength: number
    }
  | {
      readonly kind: 'InvalidPayPercent'
      readonly resource: ResourceKind
      readonly percent: number
    }
