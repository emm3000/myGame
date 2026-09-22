import {
  type Player,
  SignInRequestSchema,
  type SignUpRequest,
  SignUpRequestSchema,
} from '@mygame/contracts'
import { err, ok, type Result } from '@mygame/domain'
import { type Context, Hono } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { SignedIn } from '../auth/SignedIn'
import { type SignInDependencies, signIn } from '../auth/signIn'
import { type SignUpDependencies, signUp } from '../auth/signUp'
import { answerRefusal } from '../http/answerRefusal'
import { bodyOf } from '../http/bodyOf'
import type { Refusal } from '../http/Refusal'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'
import { clearSessionCookie, writeSessionCookie } from '../http/sessionCookie'

export type AuthDependencies = SignUpDependencies & SignInDependencies & RequirePlayerDependencies

const parseSignUp = (body: unknown): Result<SignUpRequest, Refusal> => {
  const parsed = SignUpRequestSchema.safeParse(body)
  if (parsed.success) {
    return ok(parsed.data)
  }
  const isWeakPassword = parsed.error.issues.some(
    (issue) => issue.path[0] === 'password' && issue.code === 'too_small',
  )
  return err(isWeakPassword ? { kind: 'WeakPassword' } : { kind: 'MalformedRequest' })
}

const answerSignedIn = (
  c: Context,
  signedIn: Result<SignedIn, Refusal>,
  status: ContentfulStatusCode,
  isSessionCookieSecure: boolean,
): Response => {
  if (!signedIn.ok) {
    return answerRefusal(c, signedIn.error)
  }
  writeSessionCookie(c, signedIn.value.session, isSessionCookieSecure)
  const body: Player = signedIn.value.player
  return c.json(body, status)
}

export const authRoutes = (dependencies: AuthDependencies): Hono => {
  const signedInPlayer = requirePlayer(dependencies)
  return new Hono()
    .post('/sign-up', async (c) => {
      const request = parseSignUp(await bodyOf(c))
      if (!request.ok) {
        return answerRefusal(c, request.error)
      }
      return answerSignedIn(
        c,
        await signUp(request.value, dependencies),
        201,
        dependencies.isSessionCookieSecure,
      )
    })
    .post('/sign-in', async (c) => {
      const request = SignInRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'InvalidCredentials' })
      }
      return answerSignedIn(
        c,
        await signIn(request.data, dependencies),
        200,
        dependencies.isSessionCookieSecure,
      )
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
      const body: Player = player
      return c.json(body)
    })
}
