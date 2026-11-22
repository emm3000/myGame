import type { NativeSession } from '@mygame/contracts'
import type { ReadChromePhase, Refusal, Result, SignedIn } from '@mygame/domain'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { presentPlayer } from './presentPlayer'
import { writeSessionCookie } from './sessionCookie'

export type RespondNativeSessionDependencies = {
  readonly readChromePhase: ReadChromePhase
}

export type RespondSignedInDependencies = RespondNativeSessionDependencies & {
  readonly isSessionCookieSecure: boolean
}

export const respondSignedIn = async (
  c: Context,
  signedIn: Result<SignedIn, Refusal>,
  status: ContentfulStatusCode,
  dependencies: RespondSignedInDependencies,
): Promise<Response> => {
  if (!signedIn.ok) {
    return respondRefusal(c, signedIn.error)
  }
  const chromePhase = await dependencies.readChromePhase.execute(signedIn.value.player)
  if (!chromePhase.ok) {
    return respondRefusal(c, chromePhase.error)
  }
  writeSessionCookie(c, signedIn.value.session, dependencies.isSessionCookieSecure)
  return c.json(presentPlayer(signedIn.value.player, chromePhase.value), status)
}

export const respondNativeSession = async (
  c: Context,
  signedIn: Result<SignedIn, Refusal>,
  status: ContentfulStatusCode,
  dependencies: RespondNativeSessionDependencies,
): Promise<Response> => {
  if (!signedIn.ok) {
    return respondRefusal(c, signedIn.error)
  }
  const chromePhase = await dependencies.readChromePhase.execute(signedIn.value.player)
  if (!chromePhase.ok) {
    return respondRefusal(c, chromePhase.error)
  }
  const nativeSession: NativeSession = {
    token: signedIn.value.session.token,
    player: presentPlayer(signedIn.value.player, chromePhase.value),
  }
  return c.json(nativeSession, status)
}
