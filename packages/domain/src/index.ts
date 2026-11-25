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
export {
  AnswerHoldoutCheck,
  type AnswerHoldoutCheckCommand,
  type AnswerHoldoutCheckDependencies,
} from '#holdout/application/AnswerHoldoutCheck'
export {
  BeginHoldoutCheck,
  type BeginHoldoutCheckCommand,
  type BeginHoldoutCheckDependencies,
} from '#holdout/application/BeginHoldoutCheck'
export {
  ReadHoldoutChecks,
  type ReadHoldoutChecksDependencies,
  type ReadHoldoutChecksQuery,
} from '#holdout/application/ReadHoldoutChecks'
export {
  SkipHoldoutCheck,
  type SkipHoldoutCheckCommand,
  type SkipHoldoutCheckDependencies,
} from '#holdout/application/SkipHoldoutCheck'
export type { BandStart } from '#holdout/domain/BandStart'
export type { BandStartRepository } from '#holdout/domain/BandStartRepository'
export type { DueHoldoutCheck } from '#holdout/domain/DueHoldoutCheck'
export { dueHoldoutChecksOf } from '#holdout/domain/dueHoldoutChecksOf'
export type {
  BegunHoldoutCheck,
  HoldoutCheck,
  HoldoutCheckSample,
  SkippedHoldoutCheck,
  TakenHoldoutCheck,
} from '#holdout/domain/HoldoutCheck'
export type { HoldoutCheckView } from '#holdout/domain/HoldoutCheckView'
export type { HoldoutCheckWeek } from '#holdout/domain/HoldoutCheckWeek'
export { hasBandStartedAt } from '#holdout/domain/hasBandStartedAt'
export { heldOutCountOf } from '#holdout/domain/heldOutCountOf'
export { heldOutWordsAt } from '#holdout/domain/heldOutWordsAt'
export { HOLDOUT_CHECK_WEEKS, RELEASING_WEEK } from '#holdout/domain/holdoutCheckWeeks'
export type { ReleasedLesson } from '#holdout/domain/ReleasedLesson'
export { type ReleaseContent, releasedLessonsOf } from '#holdout/domain/releasedLessonsOf'
export type { Band } from '#learning/curriculum/domain/Band'
export type { BandCatalog } from '#learning/curriculum/domain/BandCatalog'
export type { BandWord } from '#learning/curriculum/domain/BandWord'
export { type BandLine, bandLinesOf } from '#learning/curriculum/domain/bandLinesOf'
export { BANDS, bandOf } from '#learning/curriculum/domain/bands'
export type { Headword } from '#learning/curriculum/domain/Headword'
export { headwordOf } from '#learning/curriculum/domain/headwordOf'
export { isLessonPlacedOut } from '#learning/curriculum/domain/isLessonPlacedOut'
export { isUnitLemma } from '#learning/curriculum/domain/isUnitLemma'
export type { LessonCatalog } from '#learning/curriculum/domain/LessonCatalog'
export { lemmaWordsOf } from '#learning/curriculum/domain/lemmaWordsOf'
export { readableWordsOf } from '#learning/curriculum/domain/readableWordsOf'
export { type Stage, stageOf } from '#learning/curriculum/domain/stageOf'
export { wordsEnteringOf } from '#learning/curriculum/domain/wordsEnteringOf'
export type { CardReader } from '#learning/domain/CardReader'
export type { CardRepository } from '#learning/domain/CardRepository'
export type { HeldCard } from '#learning/domain/HeldCard'
export { type HeldCards, heldCardsOf } from '#learning/domain/HeldCards'
export { holdsLessonCards } from '#learning/domain/holdsLessonCards'
export type { LearnerStores } from '#learning/domain/LearnerStores'
export type { LaterFrame, Lesson, LessonId, LessonWord, WordId } from '#learning/domain/Lesson'
export type { LessonSkill } from '#learning/domain/LessonSkill'
export { anchorFrameOf } from '#learning/frames/domain/anchorFrameOf'
export type { FrameCatalog } from '#learning/frames/domain/FrameCatalog'
export type { FrameLearner } from '#learning/frames/domain/FrameLearner'
export type { FrameSpan, FrameSpans } from '#learning/frames/domain/FrameSpan'
export type { FrameToken } from '#learning/frames/domain/FrameToken'
export { openTextsOf, type TextLearner } from '#learning/frames/domain/openTextsOf'
export { readingFrameOf } from '#learning/frames/domain/readingFrameOf'
export type { Text, TextId } from '#learning/frames/domain/Text'
export type { TextCatalog } from '#learning/frames/domain/TextCatalog'
export { type TextReading, textReadingOf } from '#learning/frames/domain/textReadingOf'
export type { WordFrame } from '#learning/frames/domain/WordFrame'
export { cardsInLearningOf } from '#learning/retention/domain/cardsInLearningOf'
export { isWordRetained } from '#learning/retention/domain/isWordRetained'
export { nextInLearningDueAtOf } from '#learning/retention/domain/nextInLearningDueAtOf'
export { retainedWordCountOf } from '#learning/retention/domain/retainedWordCountOf'
export { type RetainedWords, retainedWordsOf } from '#learning/retention/domain/retainedWordsOf'
export { skillLevelOf } from '#learning/retention/domain/skillLevelOf'
export { stableWordCountOf } from '#learning/retention/domain/stableWordCountOf'
export { type WordStanding, wordStandingOf } from '#learning/retention/domain/wordStandingOf'
export {
  RequestReviewHint,
  type RequestReviewHintCommand,
  type RequestReviewHintDependencies,
} from '#learning/reviews/application/RequestReviewHint'
export {
  ServeDueReviews,
  type ServeDueReviewsDependencies,
  type ServeDueReviewsQuery,
} from '#learning/reviews/application/ServeDueReviews'
export {
  SubmitReviewAnswer,
  type SubmitReviewAnswerCommand,
  type SubmitReviewAnswerDependencies,
} from '#learning/reviews/application/SubmitReviewAnswer'
export type { AnsweredReview } from '#learning/reviews/domain/AnsweredReview'
export type { AnswerReviewCommand } from '#learning/reviews/domain/AnswerReviewCommand'
export type { DueReviews, PromptedReview } from '#learning/reviews/domain/DueReviews'
export type { DueCard } from '#learning/reviews/domain/dueCardsAt'
export { gradeTypedAnswer, type TypedAnswerGrade } from '#learning/reviews/domain/gradeTypedAnswer'
export { nextDueAtOf } from '#learning/reviews/domain/nextDueAtOf'
export type { PendingReview } from '#learning/reviews/domain/PendingReview'
export type { PendingReviewRepository } from '#learning/reviews/domain/PendingReviewRepository'
export { type ReviewFormat, reviewFormatOf } from '#learning/reviews/domain/ReviewFormat'
export type { ReviewLog } from '#learning/reviews/domain/ReviewLog'
export type { ReviewLogEntry } from '#learning/reviews/domain/ReviewLogEntry'
export type { ReviewOutcome } from '#learning/reviews/domain/ReviewOutcome'
export { readFirstOf } from '#learning/reviews/domain/readFirstOf'
export {
  type RecognitionChoice,
  recognitionChoicesOf,
} from '#learning/reviews/domain/recognitionChoicesOf'
export {
  type ReviewPrompt,
  reviewPromptOf,
  type ShownWord,
} from '#learning/reviews/domain/reviewPromptOf'
export { type ChromePhase, chromePhaseOf } from '#learning/scaffold/domain/chromePhaseOf'
export { glossOf } from '#learning/scaffold/domain/glossOf'
export type { Scaffold } from '#learning/scaffold/domain/Scaffold'
export { type SupportLevel, supportLevelOf } from '#learning/scaffold/domain/supportLevelOf'
export { type SupportText, supportTextOf } from '#learning/scaffold/domain/supportTextOf'
export type { WordSupport } from '#learning/scaffold/domain/WordSupport'
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
export {
  AnswerPlacement,
  type AnswerPlacementCommand,
  type AnswerPlacementDependencies,
} from '#placement/application/AnswerPlacement'
export {
  BeginPlacement,
  type BeginPlacementCommand,
  type BeginPlacementDependencies,
} from '#placement/application/BeginPlacement'
export {
  ReadPlacement,
  type ReadPlacementDependencies,
  type ReadPlacementQuery,
} from '#placement/application/ReadPlacement'
export {
  SkipPlacement,
  type SkipPlacementCommand,
  type SkipPlacementDependencies,
} from '#placement/application/SkipPlacement'
export type {
  Placement,
  PlacementSample,
  PlacementScore,
  SkippedPlacement,
  TakenPlacement,
} from '#placement/domain/Placement'
export type { PlacementRepository } from '#placement/domain/PlacementRepository'
export type { PlacementItem, PlacementView } from '#placement/domain/PlacementView'
export type { PlacementWord } from '#placement/domain/PlacementWord'
export type { PlacementWordCatalog } from '#placement/domain/PlacementWordCatalog'
export { placedOutBandsOf } from '#placement/domain/placedOutBandsOf'
export { placementScoresOf } from '#placement/domain/placementScoresOf'
export type { PlacementAnswer } from '#placement/domain/rightWordIdsOf'
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
export {
  type ReportNotServed,
  type ServedReport,
  ServeReport,
  type ServeReportDependencies,
  type ServeReportQuery,
} from '#report/application/ServeReport'
export type { ReportClosings } from '#report/domain/ReportClosings'
export type { SeasonKind } from '#season/domain/SeasonKind'
export { type Season, seasonAt } from '#season/domain/seasonAt'
export { Duration } from '#time/Duration'
export { Instant } from '#time/Instant'
export { laterOf } from '#time/laterOf'
export {
  FoundTown,
  type FoundTownCommand,
  type FoundTownDependencies,
} from '#town/application/FoundTown'
export {
  ResolveCurrentTown,
  type ResolveCurrentTownDependencies,
} from '#town/application/ResolveCurrentTown'
export {
  ResolveTownForText,
  type ResolveTownForTextDependencies,
} from '#town/application/ResolveTownForText'
export type { SeenTowns } from '#town/away/domain/SeenTowns'
export type { TownOverviewReading } from '#town/away/domain/TownOverviewReading'
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
export {
  DismissGuidance,
  type DismissGuidanceDependencies,
} from '#town/guidance/application/DismissGuidance'
export {
  MarkTipSeen,
  type MarkTipSeenCommand,
  type MarkTipSeenDependencies,
} from '#town/guidance/application/MarkTipSeen'
export type { GuidanceDismissals } from '#town/guidance/domain/GuidanceDismissals'
export type { NextStep } from '#town/guidance/domain/NextStep'
export { type GoalShortfall, type NextGoal, nextGoalOf } from '#town/guidance/domain/nextGoalOf'
export {
  type NextStepReading,
  type NextStepTerms,
  nextStepOf,
} from '#town/guidance/domain/nextStepOf'
export {
  type ReadyStock,
  type ResourceNeed,
  readyMinuteOf,
} from '#town/guidance/domain/readyMinuteOf'
export type { SeenTips } from '#town/guidance/domain/SeenTips'
export type { TipKind } from '#town/guidance/domain/TipKind'
export type { TownGoal } from '#town/guidance/domain/TownGoal'
export { tipKinds } from '#town/guidance/domain/tipKinds'
export { type TipReading, tipOf } from '#town/guidance/domain/tipOf'
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
export {
  ResolveTownNews,
  type ResolveTownNewsDependencies,
} from '#town/news/application/ResolveTownNews'
export { type Accrual, accrueTown } from '#town/resources/domain/accrueTown'
export { deriveFullAt, type FullAt } from '#town/resources/domain/deriveFullAt'
export { deriveResourceRates, type ResourceRates } from '#town/resources/domain/deriveResourceRates'
export { deriveStorageCapacity } from '#town/resources/domain/deriveStorageCapacity'
export { type FullSince, noStoreFull } from '#town/resources/domain/FullSince'
export type { ResourceKind } from '#town/resources/domain/ResourceKind'
export { rebaseFullSince } from '#town/resources/domain/rebaseFullSince'
export { resourceKinds } from '#town/resources/domain/resourceKinds'
export type { Stocks } from '#town/resources/domain/Stocks'
export {
  StartSchoolLesson,
  type StartSchoolLessonCommand,
  type StartSchoolLessonDependencies,
} from '#town/school/application/StartSchoolLesson'
export {
  StopSchoolLesson,
  type StopSchoolLessonCommand,
  type StopSchoolLessonDependencies,
} from '#town/school/application/StopSchoolLesson'
export { isLessonFinishedBy } from '#town/school/domain/isLessonFinishedBy'
export { isLessonUnderStudy } from '#town/school/domain/isLessonUnderStudy'
export {
  type BusyLessonSlot,
  idleLessonSlot,
  type LessonSlot,
} from '#town/school/domain/LessonSlot'
export type { LessonSlotRepository } from '#town/school/domain/LessonSlotRepository'
export { lessonDurationSecondsAt } from '#town/school/domain/lessonDurationSecondsAt'
export type { SchoolLesson } from '#town/school/domain/SchoolLesson'
export type { SchoolLevel } from '#town/school/domain/SchoolLevel'
export { schoolLevelOf } from '#town/school/domain/schoolLevelOf'
export type { DomainError } from './DomainError'
export { allOk, err, ok, type Result } from './Result'
