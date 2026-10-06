import {
  ForgotPasswordRequestSchema,
  type Player,
  ResetPasswordRequestSchema,
  SignInRequestSchema,
  SignUpRequestSchema,
  VerifyEmailRequestSchema,
} from '@mygame/contracts'
import type { Result } from '@mygame/domain'
import { type Context, Hono } from 'hono'
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
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'
import { clearSessionCookie, writeSessionCookie } from '../http/sessionCookie'

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

type ParseIssue = {
  readonly path: ReadonlyArray<PropertyKey>
  readonly code: string
}

const passwordRequestRefusalOf = (issues: ReadonlyArray<ParseIssue>): Refusal =>
  issues.some((issue) => issue.path[0] === 'password' && issue.code === 'too_small')
    ? { kind: 'WeakPassword' }
    : { kind: 'MalformedRequest' }

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

export const authRoutes = (dependencies: AuthDependencies): Hono => {
  const signedInPlayer = requirePlayer(dependencies)
  return new Hono()
    .post('/sign-up', async (c) => {
      const request = SignUpRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, passwordRequestRefusalOf(request.error.issues))
      }
      return answerSignedIn(c, await signUp(request.data, dependencies), 201, dependencies)
    })
    .post('/sign-in', async (c) => {
      const request = SignInRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'InvalidCredentials' })
      }
      return answerSignedIn(c, await signIn(request.data, dependencies), 200, dependencies)
    })
    .post('/sign-out', signedInPlayer, async (c) => {
      await dependencies.accounts.closeSession(c.var.sessionToken)
      clearSessionCookie(c, dependencies.isSessionCookieSecure)
      return c.body(null, 204)
    })
    .get('/session', signedInPlayer, async (c) => {
      const player = await dependencies.accounts.playerOf(c.var.playerId)
      if (player === undefined) {
        return answerRefusal(c, { kind: 'SignedOut' })
      }
      return c.json(await playerOf(player, dependencies.seenHints))
    })
    .post('/verify-email', async (c) => {
      const request = VerifyEmailRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerDone(c, await verifyEmail(request.data, dependencies))
    })
    .post('/verify-email/resend', signedInPlayer, async (c) =>
      answerDone(c, await resendVerificationMail(c.var.playerId, dependencies)),
    )
    .post('/forgot-password', async (c) => {
      const request = ForgotPasswordRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      await requestPasswordReset(request.data, dependencies)
      return c.body(null, 202)
    })
    .post('/reset-password', async (c) => {
      const request = ResetPasswordRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, passwordRequestRefusalOf(request.error.issues))
      }
      return answerDone(c, await resetPassword(request.data, dependencies))
    })
}
