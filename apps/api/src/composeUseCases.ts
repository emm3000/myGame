import {
  CallJobBack,
  type CallJobBackDependencies,
  FoundTown,
  type FoundTownDependencies,
  PlaceHiringOrder,
  type PlaceHiringOrderDependencies,
  QuoteCleanUp,
  type QuoteCleanUpDependencies,
  QuoteJob,
  type QuoteJobDependencies,
  ReadChromePhase,
  type ReadChromePhaseDependencies,
  ReadRegionMap,
  type ReadRegionMapDependencies,
  RequestPasswordReset,
  type RequestPasswordResetDependencies,
  ResendVerificationMail,
  type ResendVerificationMailDependencies,
  ResetPassword,
  type ResetPasswordDependencies,
  ResolveCurrentTown,
  type ResolveCurrentTownDependencies,
  SendCleanUp,
  type SendCleanUpDependencies,
  SendJob,
  type SendJobDependencies,
  SignIn,
  type SignInDependencies,
  SignUp,
  type SignUpDependencies,
  StartBuildingWork,
  type StartBuildingWorkDependencies,
  StopBuildingWork,
  type StopBuildingWorkDependencies,
  StopHiringOrder,
  type StopHiringOrderDependencies,
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
  SendJobDependencies &
  QuoteJobDependencies &
  SendCleanUpDependencies &
  QuoteCleanUpDependencies &
  CallJobBackDependencies &
  ReadRegionMapDependencies &
  StartBuildingWorkDependencies &
  StopBuildingWorkDependencies &
  PlaceHiringOrderDependencies &
  StopHiringOrderDependencies

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
})
