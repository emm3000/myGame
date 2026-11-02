import { OpenAPIHono } from '@hono/zod-openapi'
import {
  ForgotPasswordRequestSchema,
  type NativeSession,
  type Player,
  ResetPasswordRequestSchema,
  SignInRequestSchema,
  SignUpRequestSchema,
  VerifyEmailRequestSchema,
} from '@mygame/contracts'
import type { Result } from '@mygame/domain'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { StoredPlayer } from '../auth/Accounts'
import {
  type RequestPasswordResetDependencies,
  requestPasswordReset,
} from '../auth/requestPasswordReset'
import {
  type ResendVerificationMailDependencies,
  resendVerificationMail,
} from '../auth/resendVerificationMail'
import { type ResetPasswordDependencies, resetPassword } from '../auth/resetPassword'
import type { SignedIn } from '../auth/SignedIn'
import { type SignInDependencies, signIn } from '../auth/signIn'
import { type SignUpDependencies, signUp } from '../auth/signUp'
import { type VerifyEmailDependencies, verifyEmail } from '../auth/verifyEmail'
import type { SeenHints } from '../hint/SeenHints'
import { answerRefusal } from '../http/answerRefusal'
import { bodyOf } from '../http/bodyOf'
import type { Refusal } from '../http/Refusal'
import { type NamedIssue, requestRefusalOf } from '../http/requestRefusalOf'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'
import { clearSessionCookie, writeSessionCookie } from '../http/sessionCookie'
import { authDeclarations } from './authDeclarations'

export type AuthDependencies = SignUpDependencies &
  SignInDependencies &
  VerifyEmailDependencies &
  ResendVerificationMailDependencies &
  RequestPasswordResetDependencies &
  ResetPasswordDependencies &
  RequirePlayerDependencies & {
    readonly seenHints: SeenHints
  }

const playerOf = async (stored: StoredPlayer, seenHints: SeenHints): Promise<Player> => ({
  id: stored.id,
  email: stored.email,
  emailVerified: stored.emailVerified,
  seenHints: [...(await seenHints.seenHintsOf(stored.id))],
})

const answerDone = (c: Context, done: Result<void, Refusal>): Response =>
  done.ok ? c.body(null, 204) : answerRefusal(c, done.error)

const accountIssues: ReadonlyArray<NamedIssue> = [
  ['email', 'invalid_format', { kind: 'MalformedEmail' }],
  ['password', 'too_small', { kind: 'WeakPassword' }],
  ['fiefName', 'too_small', { kind: 'BlankFiefName' }],
]

const answerSignedIn = async (
  c: Context,
  signedIn: Result<SignedIn, Refusal>,
  status: ContentfulStatusCode,
  { isSessionCookieSecure, seenHints }: AuthDependencies,
): Promise<Response> => {
  if (!signedIn.ok) {
    return answerRefusal(c, signedIn.error)
  }
  writeSessionCookie(c, signedIn.value.session, isSessionCookieSecure)
  return c.json(await playerOf(signedIn.value.player, seenHints), status)
}

const answerNativeSession = async (
  c: Context,
  signedIn: Result<SignedIn, Refusal>,
  status: ContentfulStatusCode,
  { seenHints }: AuthDependencies,
): Promise<Response> => {
  if (!signedIn.ok) {
    return answerRefusal(c, signedIn.error)
  }
  const nativeSession: NativeSession = {
    token: signedIn.value.session.token,
    player: await playerOf(signedIn.value.player, seenHints),
  }
  return c.json(nativeSession, status)
}

export const authRoutes = (dependencies: AuthDependencies): OpenAPIHono => {
  const signedInPlayer = requirePlayer(dependencies)
  const routes = new OpenAPIHono()
  for (const declaration of Object.values(authDeclarations)) {
    routes.openAPIRegistry.registerPath(declaration)
  }
  routes.on(authDeclarations.signUp.method, authDeclarations.signUp.path, async (c) => {
    const request = SignUpRequestSchema.safeParse(await bodyOf(c))
    if (!request.success) {
      return answerRefusal(c, requestRefusalOf(accountIssues, request.error.issues))
    }
    return answerSignedIn(c, await signUp(request.data, dependencies), 201, dependencies)
  })
  routes.on(authDeclarations.nativeSignUp.method, authDeclarations.nativeSignUp.path, async (c) => {
    const request = SignUpRequestSchema.safeParse(await bodyOf(c))
    if (!request.success) {
      return answerRefusal(c, requestRefusalOf(accountIssues, request.error.issues))
    }
    return answerNativeSession(c, await signUp(request.data, dependencies), 201, dependencies)
  })
  routes.on(authDeclarations.signIn.method, authDeclarations.signIn.path, async (c) => {
    const request = SignInRequestSchema.safeParse(await bodyOf(c))
    if (!request.success) {
      return answerRefusal(c, { kind: 'InvalidCredentials' })
    }
    return answerSignedIn(c, await signIn(request.data, dependencies), 200, dependencies)
  })
  routes.on(authDeclarations.nativeSignIn.method, authDeclarations.nativeSignIn.path, async (c) => {
    const request = SignInRequestSchema.safeParse(await bodyOf(c))
    if (!request.success) {
      return answerRefusal(c, { kind: 'InvalidCredentials' })
    }
    return answerNativeSession(c, await signIn(request.data, dependencies), 200, dependencies)
  })
  routes.on(
    authDeclarations.signOut.method,
    authDeclarations.signOut.path,
    signedInPlayer,
    async (c) => {
      await dependencies.accounts.closeSession(c.var.sessionToken)
      clearSessionCookie(c, dependencies.isSessionCookieSecure)
      return c.body(null, 204)
    },
  )
  routes.on(
    authDeclarations.session.method,
    authDeclarations.session.path,
    signedInPlayer,
    async (c) => {
      const player = await dependencies.accounts.playerOf(c.var.playerId)
      if (player === undefined) {
        return answerRefusal(c, { kind: 'SignedOut' })
      }
      return c.json(await playerOf(player, dependencies.seenHints))
    },
  )
  routes.on(authDeclarations.verifyEmail.method, authDeclarations.verifyEmail.path, async (c) => {
    const request = VerifyEmailRequestSchema.safeParse(await bodyOf(c))
    if (!request.success) {
      return answerRefusal(c, { kind: 'MalformedRequest' })
    }
    return answerDone(c, await verifyEmail(request.data, dependencies))
  })
  routes.on(
    authDeclarations.resendVerification.method,
    authDeclarations.resendVerification.path,
    signedInPlayer,
    async (c) => answerDone(c, await resendVerificationMail(c.var.playerId, dependencies)),
  )
  routes.on(
    authDeclarations.forgotPassword.method,
    authDeclarations.forgotPassword.path,
    async (c) => {
      const request = ForgotPasswordRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      await requestPasswordReset(request.data, dependencies)
      return c.body(null, 202)
    },
  )
  routes.on(
    authDeclarations.resetPassword.method,
    authDeclarations.resetPassword.path,
    async (c) => {
      const request = ResetPasswordRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, requestRefusalOf(accountIssues, request.error.issues))
      }
      return answerDone(c, await resetPassword(request.data, dependencies))
    },
  )
  return routes
}
