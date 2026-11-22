import { OpenAPIHono } from '@hono/zod-openapi'
import {
  ChangeScaffoldController,
  type ChangeScaffoldControllerDependencies,
  changeScaffoldDeclaration,
} from './ChangeScaffoldController'
import { nativeSignInDeclaration } from './NativeSignInController'
import { nativeSignUpDeclaration } from './NativeSignUpController'
import { readSessionDeclaration } from './ReadSessionController'
import {
  RequestPasswordResetController,
  type RequestPasswordResetControllerDependencies,
  requestPasswordResetDeclaration,
} from './RequestPasswordResetController'
import {
  ResendVerificationMailController,
  type ResendVerificationMailControllerDependencies,
  resendVerificationMailDeclaration,
} from './ResendVerificationMailController'
import {
  ResetPasswordController,
  type ResetPasswordControllerDependencies,
  resetPasswordDeclaration,
} from './ResetPasswordController'
import { requirePlayer } from './requirePlayer'
import { signInDeclaration } from './SignInController'
import { signOutDeclaration } from './SignOutController'
import { signUpDeclaration } from './SignUpController'
import { type SessionRouteDependencies, sessionRoutes } from './sessionRoutes'
import {
  VerifyEmailController,
  type VerifyEmailControllerDependencies,
  verifyEmailDeclaration,
} from './VerifyEmailController'

export type AccountRouteDependencies = SessionRouteDependencies &
  VerifyEmailControllerDependencies &
  ResendVerificationMailControllerDependencies &
  RequestPasswordResetControllerDependencies &
  ResetPasswordControllerDependencies &
  ChangeScaffoldControllerDependencies

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
  sessionRoutes(routes, dependencies)
  const signedIn = requirePlayer(dependencies)
  const verifyEmailController = new VerifyEmailController(dependencies)
  const resendVerificationMailController = new ResendVerificationMailController(dependencies)
  const requestPasswordResetController = new RequestPasswordResetController(dependencies)
  const resetPasswordController = new ResetPasswordController(dependencies)
  const changeScaffoldController = new ChangeScaffoldController(dependencies)
  routes.openAPIRegistry.registerPath(verifyEmailDeclaration)
  routes.on(verifyEmailDeclaration.method, verifyEmailDeclaration.path, (c) =>
    verifyEmailController.handle(c),
  )
  routes.openAPIRegistry.registerPath(resendVerificationMailDeclaration)
  routes.on(
    resendVerificationMailDeclaration.method,
    resendVerificationMailDeclaration.path,
    signedIn,
    (c) => resendVerificationMailController.handle(c),
  )
  routes.openAPIRegistry.registerPath(requestPasswordResetDeclaration)
  routes.on(requestPasswordResetDeclaration.method, requestPasswordResetDeclaration.path, (c) =>
    requestPasswordResetController.handle(c),
  )
  routes.openAPIRegistry.registerPath(resetPasswordDeclaration)
  routes.on(resetPasswordDeclaration.method, resetPasswordDeclaration.path, (c) =>
    resetPasswordController.handle(c),
  )
  routes.openAPIRegistry.registerPath(changeScaffoldDeclaration)
  routes.on(changeScaffoldDeclaration.method, changeScaffoldDeclaration.path, signedIn, (c) =>
    changeScaffoldController.handle(c),
  )
  return routes
}
