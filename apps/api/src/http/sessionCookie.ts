import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { CookieOptions } from 'hono/utils/cookie'
import type { Session } from '../auth/Accounts'
import { sessionLifetimeSeconds } from '../auth/sessionExpiryFrom'

const sessionCookieName = 'session'

const sessionCookieOptions = (isSecure: boolean): CookieOptions => ({
  httpOnly: true,
  secure: isSecure,
  sameSite: 'Lax',
  path: '/',
})

export const readSessionCookie = (c: Context): string | undefined => getCookie(c, sessionCookieName)

export const writeSessionCookie = (c: Context, session: Session, isSecure: boolean): void => {
  setCookie(c, sessionCookieName, session.token, {
    ...sessionCookieOptions(isSecure),
    maxAge: sessionLifetimeSeconds,
    expires: new Date(session.expiresAt.epochMilliseconds),
  })
}

export const clearSessionCookie = (c: Context, isSecure: boolean): void => {
  deleteCookie(c, sessionCookieName, sessionCookieOptions(isSecure))
}
