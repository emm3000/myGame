import type { Clock, PlayerId } from '@mygame/domain'
import { createMiddleware } from 'hono/factory'
import type { MiddlewareHandler } from 'hono/types'
import type { Accounts } from '../auth/Accounts'
import { sessionExpiryFrom } from '../auth/sessionExpiryFrom'
import { answerRefusal } from './answerRefusal'
import { readBearerToken } from './bearerToken'
import { readSessionCookie, writeSessionCookie } from './sessionCookie'

export type SignedInPlayer = {
  readonly Variables: {
    readonly playerId: PlayerId
    readonly sessionToken: string
  }
}

export type RequirePlayerDependencies = {
  readonly accounts: Accounts
  readonly clock: Clock
  readonly isSessionCookieSecure: boolean
}

export const requirePlayer = ({
  accounts,
  clock,
  isSessionCookieSecure,
}: RequirePlayerDependencies): MiddlewareHandler<SignedInPlayer> =>
  createMiddleware<SignedInPlayer>(async (c, next) => {
    const cookieToken = readSessionCookie(c)
    const token = cookieToken ?? readBearerToken(c)
    if (token === undefined) {
      return answerRefusal(c, { kind: 'SignedOut' })
    }
    const now = clock.now()
    const expiresAt = sessionExpiryFrom(now)
    const playerId = await accounts.renewSession(token, now, expiresAt)
    if (playerId === undefined) {
      return answerRefusal(c, { kind: 'SignedOut' })
    }
    if (cookieToken !== undefined) {
      writeSessionCookie(c, { token, playerId, expiresAt }, isSessionCookieSecure)
    }
    c.set('playerId', playerId)
    c.set('sessionToken', token)
    await next()
  })
