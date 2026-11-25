import {
  AnswerHoldoutCheck,
  type AnswerHoldoutCheckDependencies,
  AnswerPlacement,
  type AnswerPlacementDependencies,
  BeginHoldoutCheck,
  type BeginHoldoutCheckDependencies,
  BeginPlacement,
  type BeginPlacementDependencies,
  CallJobBack,
  type CallJobBackDependencies,
  DismissGuidance,
  type DismissGuidanceDependencies,
  FoundTown,
  type FoundTownDependencies,
  MarkTipSeen,
  type MarkTipSeenDependencies,
  PlaceHiringOrder,
  type PlaceHiringOrderDependencies,
  QuoteCleanUp,
  type QuoteCleanUpDependencies,
  QuoteJob,
  type QuoteJobDependencies,
  ReadChromePhase,
  type ReadChromePhaseDependencies,
  ReadHoldoutChecks,
  type ReadHoldoutChecksDependencies,
  ReadPlacement,
  type ReadPlacementDependencies,
  ReadRegionMap,
  type ReadRegionMapDependencies,
  RequestPasswordReset,
  type RequestPasswordResetDependencies,
  RequestReviewHint,
  type RequestReviewHintDependencies,
  ResendVerificationMail,
  type ResendVerificationMailDependencies,
  ResetPassword,
  type ResetPasswordDependencies,
  ResolveCurrentTown,
  type ResolveCurrentTownDependencies,
  ResolveTownForText,
  type ResolveTownForTextDependencies,
  ResolveTownNews,
  type ResolveTownNewsDependencies,
  SendCleanUp,
  type SendCleanUpDependencies,
  SendJob,
  type SendJobDependencies,
  ServeDueReviews,
  type ServeDueReviewsDependencies,
  ServeReport,
  type ServeReportDependencies,
  SignIn,
  type SignInDependencies,
  SignUp,
  type SignUpDependencies,
  SkipHoldoutCheck,
  type SkipHoldoutCheckDependencies,
  SkipPlacement,
  type SkipPlacementDependencies,
  StartBuildingWork,
  type StartBuildingWorkDependencies,
  StartSchoolLesson,
  type StartSchoolLessonDependencies,
  StopBuildingWork,
  type StopBuildingWorkDependencies,
  StopHiringOrder,
  type StopHiringOrderDependencies,
  StopSchoolLesson,
  type StopSchoolLessonDependencies,
  SubmitReviewAnswer,
  type SubmitReviewAnswerDependencies,
  VerifyEmail,
  type VerifyEmailDependencies,
} from '@mygame/domain'

export type UseCaseDependencies = SignUpDependencies &
  SignInDependencies &
  VerifyEmailDependencies &
  ResendVerificationMailDependencies &
  RequestPasswordResetDependencies &
  ResetPasswordDependencies &
  ReadChromePhaseDependencies &
  FoundTownDependencies &
  ResolveCurrentTownDependencies &
  ResolveTownForTextDependencies &
  SendJobDependencies &
  QuoteJobDependencies &
  SendCleanUpDependencies &
  QuoteCleanUpDependencies &
  CallJobBackDependencies &
  ReadRegionMapDependencies &
  StartBuildingWorkDependencies &
  StopBuildingWorkDependencies &
  PlaceHiringOrderDependencies &
  StopHiringOrderDependencies &
  StartSchoolLessonDependencies &
  StopSchoolLessonDependencies &
  ResolveTownNewsDependencies &
  MarkTipSeenDependencies &
  DismissGuidanceDependencies &
  ReadPlacementDependencies &
  BeginPlacementDependencies &
  SkipPlacementDependencies &
  AnswerPlacementDependencies &
  ReadHoldoutChecksDependencies &
  BeginHoldoutCheckDependencies &
  AnswerHoldoutCheckDependencies &
  SkipHoldoutCheckDependencies &
  ServeDueReviewsDependencies &
  RequestReviewHintDependencies &
  SubmitReviewAnswerDependencies &
  ServeReportDependencies

export type UseCases = {
  readonly signUp: SignUp
  readonly signIn: SignIn
  readonly verifyEmail: VerifyEmail
  readonly resendVerificationMail: ResendVerificationMail
  readonly requestPasswordReset: RequestPasswordReset
  readonly resetPassword: ResetPassword
  readonly readChromePhase: ReadChromePhase
  readonly foundTown: FoundTown
  readonly resolveCurrentTown: ResolveCurrentTown
  readonly resolveTownForText: ResolveTownForText
  readonly sendJob: SendJob
  readonly quoteJob: QuoteJob
  readonly sendCleanUp: SendCleanUp
  readonly quoteCleanUp: QuoteCleanUp
  readonly callJobBack: CallJobBack
  readonly readRegionMap: ReadRegionMap
  readonly startBuildingWork: StartBuildingWork
  readonly stopBuildingWork: StopBuildingWork
  readonly placeHiringOrder: PlaceHiringOrder
  readonly stopHiringOrder: StopHiringOrder
  readonly startSchoolLesson: StartSchoolLesson
  readonly stopSchoolLesson: StopSchoolLesson
  readonly resolveTownNews: ResolveTownNews
  readonly markTipSeen: MarkTipSeen
  readonly dismissGuidance: DismissGuidance
  readonly readPlacement: ReadPlacement
  readonly beginPlacement: BeginPlacement
  readonly skipPlacement: SkipPlacement
  readonly answerPlacement: AnswerPlacement
  readonly readHoldoutChecks: ReadHoldoutChecks
  readonly beginHoldoutCheck: BeginHoldoutCheck
  readonly answerHoldoutCheck: AnswerHoldoutCheck
  readonly skipHoldoutCheck: SkipHoldoutCheck
  readonly serveDueReviews: ServeDueReviews
  readonly requestReviewHint: RequestReviewHint
  readonly submitReviewAnswer: SubmitReviewAnswer
  readonly serveReport: ServeReport
}

export const composeUseCases = (adapters: UseCaseDependencies): UseCases => ({
  signUp: new SignUp(adapters),
  signIn: new SignIn(adapters),
  verifyEmail: new VerifyEmail(adapters),
  resendVerificationMail: new ResendVerificationMail(adapters),
  requestPasswordReset: new RequestPasswordReset(adapters),
  resetPassword: new ResetPassword(adapters),
  readChromePhase: new ReadChromePhase(adapters),
  foundTown: new FoundTown(adapters),
  resolveCurrentTown: new ResolveCurrentTown(adapters),
  resolveTownForText: new ResolveTownForText(adapters),
  sendJob: new SendJob(adapters),
  quoteJob: new QuoteJob(adapters),
  sendCleanUp: new SendCleanUp(adapters),
  quoteCleanUp: new QuoteCleanUp(adapters),
  callJobBack: new CallJobBack(adapters),
  readRegionMap: new ReadRegionMap(adapters),
  startBuildingWork: new StartBuildingWork(adapters),
  stopBuildingWork: new StopBuildingWork(adapters),
  placeHiringOrder: new PlaceHiringOrder(adapters),
  stopHiringOrder: new StopHiringOrder(adapters),
  startSchoolLesson: new StartSchoolLesson(adapters),
  stopSchoolLesson: new StopSchoolLesson(adapters),
  resolveTownNews: new ResolveTownNews(adapters),
  markTipSeen: new MarkTipSeen(adapters),
  dismissGuidance: new DismissGuidance(adapters),
  readPlacement: new ReadPlacement(adapters),
  beginPlacement: new BeginPlacement(adapters),
  skipPlacement: new SkipPlacement(adapters),
  answerPlacement: new AnswerPlacement(adapters),
  readHoldoutChecks: new ReadHoldoutChecks(adapters),
  beginHoldoutCheck: new BeginHoldoutCheck(adapters),
  answerHoldoutCheck: new AnswerHoldoutCheck(adapters),
  skipHoldoutCheck: new SkipHoldoutCheck(adapters),
  serveDueReviews: new ServeDueReviews(adapters),
  requestReviewHint: new RequestReviewHint(adapters),
  submitReviewAnswer: new SubmitReviewAnswer(adapters),
  serveReport: new ServeReport(adapters),
})
