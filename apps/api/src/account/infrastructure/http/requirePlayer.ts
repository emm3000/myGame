import type { Clock, PlayerId } from '@mygame/domain'
import { createMiddleware } from 'hono/factory'
import type { MiddlewareHandler } from 'hono/types'
import { readBearerToken } from '#platform/infrastructure/http/bearerToken'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import type { Sessions } from '../../application/ports/Sessions'
import { sessionExpiryFrom } from '../../application/sessionExpiryFrom'
import { readSessionCookie, writeSessionCookie } from './sessionCookie'

export type SignedInPlayer = {
  readonly Variables: {
    readonly playerId: PlayerId
    readonly sessionToken: string
  }
}

export type RequirePlayerDependencies = {
  readonly sessions: Sessions
  readonly clock: Clock
  readonly isSessionCookieSecure: boolean
}

export const requirePlayer = ({
  sessions,
  clock,
  isSessionCookieSecure,
}: RequirePlayerDependencies): MiddlewareHandler<SignedInPlayer> =>
  createMiddleware<SignedInPlayer>(async (c, next) => {
    const cookieToken = readSessionCookie(c)
    const token = cookieToken ?? readBearerToken(c)
    if (token === undefined) {
      return respondRefusal(c, { kind: 'SignedOut' })
    }
    const now = clock.now()
    const expiresAt = sessionExpiryFrom(now)
    const playerId = await sessions.renewSession(token, now, expiresAt)
    if (playerId === undefined) {
      return respondRefusal(c, { kind: 'SignedOut' })
    }
    if (cookieToken !== undefined) {
      writeSessionCookie(c, { token, playerId, expiresAt }, isSessionCookieSecure)
    }
    c.set('playerId', playerId)
    c.set('sessionToken', token)
    await next()
  })
