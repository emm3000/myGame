import type { OpenAPIHono } from '@hono/zod-openapi'
import {
  NativeSignInController,
  type NativeSignInControllerDependencies,
  nativeSignInDeclaration,
} from './NativeSignInController'
import {
  NativeSignUpController,
  type NativeSignUpControllerDependencies,
  nativeSignUpDeclaration,
} from './NativeSignUpController'
import {
  ReadSessionController,
  type ReadSessionControllerDependencies,
  readSessionDeclaration,
} from './ReadSessionController'
import { type RequirePlayerDependencies, requirePlayer } from './requirePlayer'
import {
  SignInController,
  type SignInControllerDependencies,
  signInDeclaration,
} from './SignInController'
import {
  SignOutController,
  type SignOutControllerDependencies,
  signOutDeclaration,
} from './SignOutController'
import {
  SignUpController,
  type SignUpControllerDependencies,
  signUpDeclaration,
} from './SignUpController'

export type SessionRouteDependencies = RequirePlayerDependencies &
  SignUpControllerDependencies &
  NativeSignUpControllerDependencies &
  SignInControllerDependencies &
  NativeSignInControllerDependencies &
  SignOutControllerDependencies &
  ReadSessionControllerDependencies

export const sessionRoutes = (
  routes: OpenAPIHono,
  dependencies: SessionRouteDependencies,
): void => {
  const signedIn = requirePlayer(dependencies)
  const signUpController = new SignUpController(dependencies)
  const nativeSignUpController = new NativeSignUpController(dependencies)
  const signInController = new SignInController(dependencies)
  const nativeSignInController = new NativeSignInController(dependencies)
  const signOutController = new SignOutController(dependencies)
  const readSessionController = new ReadSessionController(dependencies)
  routes.openAPIRegistry.registerPath(signUpDeclaration)
  routes.on(signUpDeclaration.method, signUpDeclaration.path, (c) => signUpController.handle(c))
  routes.openAPIRegistry.registerPath(nativeSignUpDeclaration)
  routes.on(nativeSignUpDeclaration.method, nativeSignUpDeclaration.path, (c) =>
    nativeSignUpController.handle(c),
  )
  routes.openAPIRegistry.registerPath(signInDeclaration)
  routes.on(signInDeclaration.method, signInDeclaration.path, (c) => signInController.handle(c))
  routes.openAPIRegistry.registerPath(nativeSignInDeclaration)
  routes.on(nativeSignInDeclaration.method, nativeSignInDeclaration.path, (c) =>
    nativeSignInController.handle(c),
  )
  routes.openAPIRegistry.registerPath(signOutDeclaration)
  routes.on(signOutDeclaration.method, signOutDeclaration.path, signedIn, (c) =>
    signOutController.handle(c),
  )
  routes.openAPIRegistry.registerPath(readSessionDeclaration)
  routes.on(readSessionDeclaration.method, readSessionDeclaration.path, signedIn, (c) =>
    readSessionController.handle(c),
  )
}
