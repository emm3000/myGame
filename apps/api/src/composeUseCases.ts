import {
  FoundTown,
  type FoundTownDependencies,
  ReadChromePhase,
  type ReadChromePhaseDependencies,
  RequestPasswordReset,
  type RequestPasswordResetDependencies,
  ResendVerificationMail,
  type ResendVerificationMailDependencies,
  ResetPassword,
  type ResetPasswordDependencies,
  ResolveCurrentTown,
  type ResolveCurrentTownDependencies,
  SignIn,
  type SignInDependencies,
  SignUp,
  type SignUpDependencies,
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
  ResolveCurrentTownDependencies

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
})
