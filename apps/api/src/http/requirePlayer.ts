import type { Clock, PlayerId } from '@mygame/domain'
import { createMiddleware } from 'hono/factory'
import type { MiddlewareHandler } from 'hono/types'
import type { DrizzleAccounts } from '../adapters/postgres/DrizzleAccounts'
import { sessionExpiryFrom } from '../auth/sessionExpiryFrom'
import { answerRefusal } from './answerRefusal'
import { readSessionCookie, writeSessionCookie } from './sessionCookie'

export type SignedInPlayer = {
  readonly Variables: {
    readonly playerId: PlayerId
    readonly sessionToken: string
  }
}

export type RequirePlayerDependencies = {
  readonly accounts: DrizzleAccounts
  readonly clock: Clock
}

export const requirePlayer = ({
  accounts,
  clock,
}: RequirePlayerDependencies): MiddlewareHandler<SignedInPlayer> =>
  createMiddleware<SignedInPlayer>(async (c, next) => {
    const token = readSessionCookie(c)
    if (token === undefined) {
      return answerRefusal(c, { kind: 'SignedOut' })
    }
    const now = clock.now()
    const expiresAt = sessionExpiryFrom(now)
    const playerId = await accounts.renewSession(token, now, expiresAt)
    if (playerId === undefined) {
      return answerRefusal(c, { kind: 'SignedOut' })
    }
    writeSessionCookie(c, { token, playerId, expiresAt })
    c.set('playerId', playerId)
    c.set('sessionToken', token)
    await next()
  })
