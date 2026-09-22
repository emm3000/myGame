import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { CookieOptions } from 'hono/utils/cookie'
import type { Session } from '../adapters/postgres/DrizzleAccounts'
import { sessionLifetimeSeconds } from '../auth/sessionExpiryFrom'

const sessionCookieName = 'session'

const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'Lax',
  path: '/',
}

export const readSessionCookie = (c: Context): string | undefined => getCookie(c, sessionCookieName)

export const writeSessionCookie = (c: Context, session: Session): void => {
  setCookie(c, sessionCookieName, session.token, {
    ...sessionCookieOptions,
    maxAge: sessionLifetimeSeconds,
    expires: new Date(session.expiresAt.epochMilliseconds),
  })
}

export const clearSessionCookie = (c: Context): void => {
  deleteCookie(c, sessionCookieName, sessionCookieOptions)
}
