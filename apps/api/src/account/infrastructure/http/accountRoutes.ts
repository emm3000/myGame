import { OpenAPIHono } from '@hono/zod-openapi'
import type { RequestPasswordResetDependencies } from '../../application/requestPasswordReset'
import type { ResetPasswordDependencies } from '../../application/resetPassword'
import type { VerifyEmailDependencies } from '../../application/verifyEmail'
import {
  type ChangeScaffoldRouteDependencies,
  changeScaffoldDeclaration,
  changeScaffoldRoute,
} from './changeScaffoldRoute'
import {
  type NativeSignInRouteDependencies,
  nativeSignInDeclaration,
  nativeSignInRoute,
} from './nativeSignInRoute'
import {
  type NativeSignUpRouteDependencies,
  nativeSignUpDeclaration,
  nativeSignUpRoute,
} from './nativeSignUpRoute'
import {
  type ReadSessionRouteDependencies,
  readSessionDeclaration,
  readSessionRoute,
} from './readSessionRoute'
import {
  requestPasswordResetDeclaration,
  requestPasswordResetRoute,
} from './requestPasswordResetRoute'
import {
  type ResendVerificationMailRouteDependencies,
  resendVerificationMailDeclaration,
  resendVerificationMailRoute,
} from './resendVerificationMailRoute'
import { resetPasswordDeclaration, resetPasswordRoute } from './resetPasswordRoute'
import { type SignInRouteDependencies, signInDeclaration, signInRoute } from './signInRoute'
import { type SignOutRouteDependencies, signOutDeclaration, signOutRoute } from './signOutRoute'
import { type SignUpRouteDependencies, signUpDeclaration, signUpRoute } from './signUpRoute'
import { verifyEmailDeclaration, verifyEmailRoute } from './verifyEmailRoute'

export type AccountRouteDependencies = SignUpRouteDependencies &
  NativeSignUpRouteDependencies &
  SignInRouteDependencies &
  NativeSignInRouteDependencies &
  SignOutRouteDependencies &
  ReadSessionRouteDependencies &
  VerifyEmailDependencies &
  ResendVerificationMailRouteDependencies &
  RequestPasswordResetDependencies &
  ResetPasswordDependencies &
  ChangeScaffoldRouteDependencies

export const accountDeclarations = {
  signUp: signUpDeclaration,
  nativeSignUp: nativeSignUpDeclaration,
  signIn: signInDeclaration,
  nativeSignIn: nativeSignInDeclaration,
  signOut: signOutDeclaration,
  session: readSessionDeclaration,
  verifyEmail: verifyEmailDeclaration,
  resendVerification: resendVerificationMailDeclaration,
  forgotPassword: requestPasswordResetDeclaration,
  resetPassword: resetPasswordDeclaration,
  changeScaffold: changeScaffoldDeclaration,
}

export const accountRoutes = (dependencies: AccountRouteDependencies): OpenAPIHono => {
  const routes = new OpenAPIHono()
  signUpRoute(routes, dependencies)
  nativeSignUpRoute(routes, dependencies)
  signInRoute(routes, dependencies)
  nativeSignInRoute(routes, dependencies)
  signOutRoute(routes, dependencies)
  readSessionRoute(routes, dependencies)
  verifyEmailRoute(routes, dependencies)
  resendVerificationMailRoute(routes, dependencies)
  requestPasswordResetRoute(routes, dependencies)
  resetPasswordRoute(routes, dependencies)
  changeScaffoldRoute(routes, dependencies)
  return routes
}
