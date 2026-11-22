export {
  ReadChromePhase,
  type ReadChromePhaseDependencies,
} from '#account/application/ReadChromePhase'
export {
  RequestPasswordReset,
  type RequestPasswordResetDependencies,
} from '#account/application/RequestPasswordReset'
export {
  ResendVerificationMail,
  type ResendVerificationMailDependencies,
} from '#account/application/ResendVerificationMail'
export { ResetPassword, type ResetPasswordDependencies } from '#account/application/ResetPassword'
export { readScaffold } from '#account/application/readScaffold'
export { SignIn, type SignInDependencies } from '#account/application/SignIn'
export { SignUp, type SignUpDependencies } from '#account/application/SignUp'
export { VerifyEmail, type VerifyEmailDependencies } from '#account/application/VerifyEmail'
export type { AccountStores } from '#account/domain/AccountStores'
export type {
  Accounts,
  NewPlayer,
  PlayerAdded,
  PlayerCredentials,
  StoredPlayer,
} from '#account/domain/Accounts'
export type { AccountToken, AccountTokenKind, AccountTokens } from '#account/domain/AccountTokens'
export { accountTokenExpiryFrom } from '#account/domain/accountTokenExpiryFrom'
export type { ChromeProgress, ChromeProgressReader } from '#account/domain/ChromeProgressReader'
export { isRedeemableAgain } from '#account/domain/isRedeemableAgain'
export type { MailCopy, MailWording } from '#account/domain/MailCopy'
export type { Mail, MailDelivery, Mailer } from '#account/domain/Mailer'
export type { MailRecipient } from '#account/domain/MailRecipient'
export type { PasswordHasher } from '#account/domain/PasswordHasher'
export type { Session, Sessions } from '#account/domain/Sessions'
export type { SessionTokens } from '#account/domain/SessionTokens'
export type { SignedIn } from '#account/domain/SignedIn'
export type { StoredScaffold } from '#account/domain/StoredScaffold'
export { sessionExpiryFrom, sessionLifetimeSeconds } from '#account/domain/sessionExpiryFrom'
export type { LessonLibrary, ShelvedLesson } from '#content/domain/LessonLibrary'
export type { BandStart } from '#holdout/BandStart'
export type { DueHoldoutCheck } from '#holdout/DueHoldoutCheck'
export { dueHoldoutChecksOf } from '#holdout/dueHoldoutChecksOf'
export type {
  BegunHoldoutCheck,
  HoldoutCheck,
  HoldoutCheckSample,
  SkippedHoldoutCheck,
  TakenHoldoutCheck,
} from '#holdout/HoldoutCheck'
export type { HoldoutCheckView } from '#holdout/HoldoutCheckView'
export type { HoldoutCheckWeek } from '#holdout/HoldoutCheckWeek'
export { hasBandStartedAt } from '#holdout/hasBandStartedAt'
export { heldOutCountOf } from '#holdout/heldOutCountOf'
export { heldOutWordsAt } from '#holdout/heldOutWordsAt'
export { HOLDOUT_CHECK_WEEKS, RELEASING_WEEK } from '#holdout/holdoutCheckWeeks'
export type { BandStartRepository } from '#holdout/ports/BandStartRepository'
export type { ReleasedLesson } from '#holdout/ReleasedLesson'
export { type ReleaseContent, releasedLessonsOf } from '#holdout/releasedLessonsOf'
export {
  type AnswerHoldoutCheckCommand,
  type AnswerHoldoutCheckDependencies,
  answerHoldoutCheck,
} from '#holdout/useCases/answerHoldoutCheck'
export {
  type BeginHoldoutCheckCommand,
  type BeginHoldoutCheckDependencies,
  beginHoldoutCheck,
} from '#holdout/useCases/beginHoldoutCheck'
export {
  type ReadHoldoutChecksDependencies,
  readHoldoutChecks,
} from '#holdout/useCases/readHoldoutChecks'
export {
  type SkipHoldoutCheckDependencies,
  skipHoldoutCheck,
} from '#holdout/useCases/skipHoldoutCheck'
export type { Band } from '#learning/curriculum/Band'
export type { BandWord } from '#learning/curriculum/BandWord'
export { type BandLine, bandLinesOf } from '#learning/curriculum/bandLinesOf'
export { BANDS, bandOf } from '#learning/curriculum/bands'
export type { Headword } from '#learning/curriculum/Headword'
export { headwordOf } from '#learning/curriculum/headwordOf'
export { isLessonPlacedOut } from '#learning/curriculum/isLessonPlacedOut'
export { isUnitLemma } from '#learning/curriculum/isUnitLemma'
export { lemmaWordsOf } from '#learning/curriculum/lemmaWordsOf'
export type { BandCatalog } from '#learning/curriculum/ports/BandCatalog'
export type { LessonCatalog } from '#learning/curriculum/ports/LessonCatalog'
export { readableWordsOf } from '#learning/curriculum/readableWordsOf'
export { type Stage, stageOf } from '#learning/curriculum/stageOf'
export { wordsEnteringOf } from '#learning/curriculum/wordsEnteringOf'
export { anchorFrameOf } from '#learning/frames/anchorFrameOf'
export type { FrameLearner } from '#learning/frames/FrameLearner'
export type { FrameSpan, FrameSpans } from '#learning/frames/FrameSpan'
export type { FrameToken } from '#learning/frames/FrameToken'
export { openTextsOf, type TextLearner } from '#learning/frames/openTextsOf'
export type { FrameCatalog } from '#learning/frames/ports/FrameCatalog'
export type { TextCatalog } from '#learning/frames/ports/TextCatalog'
export { readingFrameOf } from '#learning/frames/readingFrameOf'
export type { Text, TextId } from '#learning/frames/Text'
export { type TextReading, textReadingOf } from '#learning/frames/textReadingOf'
export type { WordFrame } from '#learning/frames/WordFrame'
export type { HeldCard } from '#learning/HeldCard'
export { type HeldCards, heldCardsOf } from '#learning/HeldCards'
export { holdsLessonCards } from '#learning/holdsLessonCards'
export type { LaterFrame, Lesson, LessonId, LessonWord, WordId } from '#learning/Lesson'
export type { LessonSkill } from '#learning/LessonSkill'
export type { CardRepository } from '#learning/ports/CardRepository'
export { cardsInLearningOf } from '#learning/retention/cardsInLearningOf'
export { isWordRetained } from '#learning/retention/isWordRetained'
export { nextInLearningDueAtOf } from '#learning/retention/nextInLearningDueAtOf'
export { retainedWordCountOf } from '#learning/retention/retainedWordCountOf'
export { type RetainedWords, retainedWordsOf } from '#learning/retention/retainedWordsOf'
export { skillLevelOf } from '#learning/retention/skillLevelOf'
export { stableWordCountOf } from '#learning/retention/stableWordCountOf'
export { type WordStanding, wordStandingOf } from '#learning/retention/wordStandingOf'
export type { AnsweredReview } from '#learning/reviews/AnsweredReview'
export type { AnswerReviewCommand } from '#learning/reviews/AnswerReviewCommand'
export type { DueCard } from '#learning/reviews/dueCardsAt'
export { gradeTypedAnswer, type TypedAnswerGrade } from '#learning/reviews/gradeTypedAnswer'
export { nextDueAtOf } from '#learning/reviews/nextDueAtOf'
export type { PendingReview } from '#learning/reviews/PendingReview'
export type { PendingReviewRepository } from '#learning/reviews/ports/PendingReviewRepository'
export type { ReviewLog } from '#learning/reviews/ports/ReviewLog'
export { type ReviewFormat, reviewFormatOf } from '#learning/reviews/ReviewFormat'
export type { ReviewLogEntry } from '#learning/reviews/ReviewLogEntry'
export { readFirstOf } from '#learning/reviews/readFirstOf'
export {
  type RecognitionChoice,
  recognitionChoicesOf,
} from '#learning/reviews/recognitionChoicesOf'
export {
  type ReviewPrompt,
  reviewPromptOf,
  type ShownWord,
} from '#learning/reviews/reviewPromptOf'
export {
  type AnswerReviewDependencies,
  answerReview,
} from '#learning/reviews/useCases/answerReview'
export {
  type Hint,
  type RequestHintCommand,
  type RequestHintDependencies,
  requestHint,
} from '#learning/reviews/useCases/requestHint'
export {
  type ShowDueReviewsCommand,
  type ShowDueReviewsDependencies,
  type ShownReview,
  showDueReviews,
} from '#learning/reviews/useCases/showDueReviews'
export { type ChromePhase, chromePhaseOf } from '#learning/scaffold/chromePhaseOf'
export { glossOf } from '#learning/scaffold/glossOf'
export type { Scaffold } from '#learning/scaffold/Scaffold'
export { type SupportLevel, supportLevelOf } from '#learning/scaffold/supportLevelOf'
export { type SupportText, supportTextOf } from '#learning/scaffold/supportTextOf'
export type { WordSupport } from '#learning/scaffold/WordSupport'
export { dueInstantOf } from '#memory/domain/dueInstantOf'
export {
  MemoryCard,
  type MemoryPlacement,
  type RecalledMemory,
  type StoredMemoryCard,
  type UnreviewedMemory,
} from '#memory/domain/MemoryCard'
export type { MemoryRating } from '#memory/domain/MemoryRating'
export {
  defaultMemoryTerms,
  type FsrsParameters,
  type MemoryTerms,
} from '#memory/domain/MemoryTerms'
export { retrievabilityOf } from '#memory/domain/retrievabilityOf'
export { reviewMemoryCard } from '#memory/domain/reviewMemoryCard'
export type {
  Placement,
  PlacementSample,
  PlacementScore,
  SkippedPlacement,
  TakenPlacement,
} from '#placement/Placement'
export type { PlacementItem, PlacementView } from '#placement/PlacementView'
export type { PlacementWord } from '#placement/PlacementWord'
export { placedOutBandsOf } from '#placement/placedOutBandsOf'
export { placementScoresOf } from '#placement/placementScoresOf'
export type { PlacementRepository } from '#placement/ports/PlacementRepository'
export type { PlacementWordCatalog } from '#placement/ports/PlacementWordCatalog'
export type { PlacementAnswer } from '#placement/rightWordIdsOf'
export {
  type AnswerPlacementCommand,
  type AnswerPlacementDependencies,
  answerPlacement,
} from '#placement/useCases/answerPlacement'
export {
  type BeginPlacementDependencies,
  beginPlacement,
} from '#placement/useCases/beginPlacement'
export { readPlacement } from '#placement/useCases/readPlacement'
export { type SkipPlacementDependencies, skipPlacement } from '#placement/useCases/skipPlacement'
export type { AfterResponse } from '#platform/domain/AfterResponse'
export type { AfterResponseDrain } from '#platform/domain/AfterResponseDrain'
export type { Clock } from '#platform/domain/Clock'
export type { FailureSink } from '#platform/domain/FailureSink'
export type { IdGenerator } from '#platform/domain/IdGenerator'
export type { RandomSource } from '#platform/domain/RandomSource'
export type { Refusal } from '#platform/domain/Refusal'
export { thrownCauseOf } from '#platform/domain/thrownCauseOf'
export type { UnitOfWork } from '#platform/domain/UnitOfWork'
export type { PlayerId } from '#player/PlayerId'
export type { SeasonKind } from '#season/domain/SeasonKind'
export { type Season, seasonAt } from '#season/domain/seasonAt'
export { Duration } from '#time/Duration'
export { Instant } from '#time/Instant'
export { laterOf } from '#time/laterOf'
export { changeTown, type TownChange } from '#town/application/changeTown'
export {
  FoundTown,
  type FoundTownCommand,
  type FoundTownDependencies,
} from '#town/application/FoundTown'
export {
  type MutateTownDependencies,
  mutateTown,
  type TownMutation,
} from '#town/application/mutateTown'
export {
  ResolveCurrentTown,
  type ResolveCurrentTownDependencies,
} from '#town/application/ResolveCurrentTown'
export { readTownReading } from '#town/application/readTownReading'
export {
  type ResolveTownReadingDependencies,
  resolveTownReading,
} from '#town/application/resolveTownReading'
export {
  StartBuildingWork,
  type StartBuildingWorkCommand,
  type StartBuildingWorkDependencies,
} from '#town/building/application/StartBuildingWork'
export {
  StopBuildingWork,
  type StopBuildingWorkCommand,
  type StopBuildingWorkDependencies,
} from '#town/building/application/StopBuildingWork'
export type { BuildingKind } from '#town/building/domain/BuildingKind'
export type {
  BuildingLevel,
  HomesLevel,
  ProducerLevel,
  StorageLevel,
} from '#town/building/domain/BuildingLevel'
export { type BuildingLevels, foundingLevels } from '#town/building/domain/BuildingLevels'
export {
  type BusyWorkSlot,
  idleWorkSlot,
  type WorkSlot,
  type WorkTarget,
} from '#town/building/domain/BuildingWork'
export { buildingKinds } from '#town/building/domain/buildingKinds'
export {
  derivePeopleForWork,
  type PeopleForWork,
} from '#town/building/domain/derivePeopleForWork'
export { type LevelWordNeed, levelWordNeedOf } from '#town/building/domain/levelWordNeedOf'
export { levelWorkAt } from '#town/building/domain/levelWorkAt'
export type { NeededWordKind } from '#town/building/domain/NeededWordKind'
export type { WaitingList, WaitingWork } from '#town/building/domain/WaitingList'
export type { WordNeed } from '#town/building/domain/WordNeed'
export { waitingListScheduleOf } from '#town/building/domain/waitingListScheduleOf'
export { type WordShortfall, wordShortfallOf } from '#town/building/domain/wordShortfallOf'
export { derivePeople } from '#town/domain/derivePeople'
export type { EarnedSkillRepository } from '#town/domain/EarnedSkillRepository'
export { earnTownSkill } from '#town/domain/earnTownSkill'
export type { People } from '#town/domain/People'
export type { ReadOnlyTowns } from '#town/domain/ReadOnlyTowns'
export type { SiteAddress } from '#town/domain/SiteAddress'
export type { Terrain } from '#town/domain/Terrain'
export { type ChangedTown, Town, type TownFounding } from '#town/domain/Town'
export { TownAddress } from '#town/domain/TownAddress'
export type { TownCatalog } from '#town/domain/TownCatalog'
export type { TownEvent, TownEventKind } from '#town/domain/TownEvent'
export type { TownId } from '#town/domain/TownId'
export type { TownLabel } from '#town/domain/TownLabel'
export { TownName } from '#town/domain/TownName'
export type { TownNews } from '#town/domain/TownNews'
export { keptEventsPerTown, type TownNewsReader } from '#town/domain/TownNewsReader'
export type { TownReader, TownWithSchool } from '#town/domain/TownReader'
export type { TownReading } from '#town/domain/TownReading'
export type { TownRepository } from '#town/domain/TownRepository'
export type {
  ProductionPercent,
  TownDurationPercent,
  TownSeasons,
  TownSettings,
} from '#town/domain/TownSettings'
export type { TownSkill } from '#town/domain/TownSkill'
export type { StoredTown } from '#town/domain/TownState'
export type { TownStores } from '#town/domain/TownStores'
export { terrainOf } from '#town/domain/terrainOf'
export { townLabelOf } from '#town/domain/townLabelOf'
export { type TownSeason, townSeasonAt } from '#town/domain/townSeasonAt'
export type { GuidanceDismissals } from '#town/guidance/domain/GuidanceDismissals'
export type { SeenTips } from '#town/guidance/domain/SeenTips'
export type { NextStep } from '#town/guidance/NextStep'
export { type GoalShortfall, type NextGoal, nextGoalOf } from '#town/guidance/nextGoalOf'
export { type NextStepReading, type NextStepTerms, nextStepOf } from '#town/guidance/nextStepOf'
export { type ReadyStock, type ResourceNeed, readyMinuteOf } from '#town/guidance/readyMinuteOf'
export type { TipKind } from '#town/guidance/TipKind'
export type { TownGoal } from '#town/guidance/TownGoal'
export { tipKinds } from '#town/guidance/tipKinds'
export { type TipReading, tipOf } from '#town/guidance/tipOf'
export {
  PlaceHiringOrder,
  type PlaceHiringOrderCommand,
  type PlaceHiringOrderDependencies,
} from '#town/hiring/application/PlaceHiringOrder'
export {
  StopHiringOrder,
  type StopHiringOrderCommand,
  type StopHiringOrderDependencies,
} from '#town/hiring/application/StopHiringOrder'
export { deliveredHiresOf } from '#town/hiring/domain/deliveredHiresOf'
export { deriveHireDurationSeconds } from '#town/hiring/domain/deriveHireDurationSeconds'
export type { HireKind } from '#town/hiring/domain/HireKind'
export { type Hires, noHires } from '#town/hiring/domain/Hires'
export type { HireTerms } from '#town/hiring/domain/HireTerms'
export {
  type HiringOrder,
  type HiringSlot,
  type HiringTarget,
  idleHiringSlot,
} from '#town/hiring/domain/HiringOrder'
export { hireKinds } from '#town/hiring/domain/hireKinds'
export { hirePercentAt } from '#town/hiring/domain/hirePercentAt'
export { hiringEndsAt } from '#town/hiring/domain/hiringEndsAt'
export { lowestFreePeopleOf } from '#town/hiring/domain/lowestFreePeopleOf'
export type { OfficeLevel } from '#town/hiring/domain/OfficeLevel'
export { requiredOfficeLevelOf } from '#town/hiring/domain/requiredOfficeLevelOf'
export {
  CallJobBack,
  type CallJobBackCommand,
  type CallJobBackDependencies,
} from '#town/jobs/application/CallJobBack'
export { QuoteCleanUp, type QuoteCleanUpDependencies } from '#town/jobs/application/QuoteCleanUp'
export { QuoteJob, type QuoteJobDependencies } from '#town/jobs/application/QuoteJob'
export {
  ReadRegionMap,
  type ReadRegionMapCommand,
  type ReadRegionMapDependencies,
} from '#town/jobs/application/ReadRegionMap'
export { SendCleanUp, type SendCleanUpDependencies } from '#town/jobs/application/SendCleanUp'
export { SendJob, type SendJobDependencies } from '#town/jobs/application/SendJob'
export type { CleanUp } from '#town/jobs/domain/CleanUp'
export type { CleanUpOrder } from '#town/jobs/domain/CleanUpOrder'
export type { CleanUpQuote } from '#town/jobs/domain/CleanUpQuote'
export type { CleanUpReader } from '#town/jobs/domain/CleanUpReader'
export type { CleanUpRepository } from '#town/jobs/domain/CleanUpRepository'
export {
  type CleanUpJob,
  idleJobSlot,
  type Job,
  type JobCleanUp,
  type JobSlot,
} from '#town/jobs/domain/Job'
export type { JobOrder, JobTarget } from '#town/jobs/domain/JobOrder'
export type { JobPayPerHour, JobTerms } from '#town/jobs/domain/JobTerms'
export { type JobInstants, jobInstantsOf } from '#town/jobs/domain/jobInstantsOf'
export { jobOneWaySeconds } from '#town/jobs/domain/jobOneWaySeconds'
export { jobPayOf } from '#town/jobs/domain/jobPayOf'
export { type JobPhase, jobPhaseAt } from '#town/jobs/domain/jobPhaseAt'
export { type JobSeason, jobSeasonAt } from '#town/jobs/domain/jobSeasonAt'
export type { RegionMap, RegionSite, SiteWaste } from '#town/jobs/domain/RegionMap'
export type { RegionMapReader, SiteHolder } from '#town/jobs/domain/RegionMapReader'
export type { WasteSize } from '#town/jobs/domain/WasteSize'
export { type Accrual, accrueTown } from '#town/resources/accrueTown'
export { deriveFullAt, type FullAt } from '#town/resources/deriveFullAt'
export { deriveResourceRates, type ResourceRates } from '#town/resources/deriveResourceRates'
export { deriveStorageCapacity } from '#town/resources/deriveStorageCapacity'
export { type FullSince, noStoreFull } from '#town/resources/FullSince'
export type { ResourceKind } from '#town/resources/ResourceKind'
export { rebaseFullSince } from '#town/resources/rebaseFullSince'
export { resourceKinds } from '#town/resources/resourceKinds'
export type { Stocks } from '#town/resources/Stocks'
export { isLessonFinishedBy } from '#town/school/isLessonFinishedBy'
export { isLessonUnderStudy } from '#town/school/isLessonUnderStudy'
export { type BusyLessonSlot, idleLessonSlot, type LessonSlot } from '#town/school/LessonSlot'
export { lessonDurationSecondsAt } from '#town/school/lessonDurationSecondsAt'
export type { LessonSlotRepository } from '#town/school/ports/LessonSlotRepository'
export type { SchoolLesson } from '#town/school/SchoolLesson'
export type { SchoolLevel } from '#town/school/SchoolLevel'
export { schoolLevelOf } from '#town/school/schoolLevelOf'
export {
  type SettleSchoolLessonDependencies,
  settleSchoolLesson,
} from '#town/school/useCases/settleSchoolLesson'
export {
  type StartSchoolLessonCommand,
  type StartSchoolLessonDependencies,
  startSchoolLesson,
} from '#town/school/useCases/startSchoolLesson'
export {
  type StopSchoolLessonCommand,
  type StopSchoolLessonDependencies,
  stopSchoolLesson,
} from '#town/school/useCases/stopSchoolLesson'
export type { DomainError } from './DomainError'
export { allOk, err, ok, type Result } from './Result'
