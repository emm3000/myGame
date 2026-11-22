import type { NativeSession } from '@mygame/contracts'
import type { Refusal, Result, SignedIn } from '@mygame/domain'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import {
  type ReadChromePhaseDependencies,
  readChromePhase,
} from '../../application/readChromePhase'
import { presentPlayer } from './presentPlayer'
import { writeSessionCookie } from './sessionCookie'

export type RespondSignedInDependencies = ReadChromePhaseDependencies & {
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
  writeSessionCookie(c, signedIn.value.session, dependencies.isSessionCookieSecure)
  return c.json(
    presentPlayer(
      signedIn.value.player,
      await readChromePhase(signedIn.value.player, dependencies),
    ),
    status,
  )
}

export const respondNativeSession = async (
  c: Context,
  signedIn: Result<SignedIn, Refusal>,
  status: ContentfulStatusCode,
  dependencies: ReadChromePhaseDependencies,
): Promise<Response> => {
  if (!signedIn.ok) {
    return respondRefusal(c, signedIn.error)
  }
  const nativeSession: NativeSession = {
    token: signedIn.value.session.token,
    player: presentPlayer(
      signedIn.value.player,
      await readChromePhase(signedIn.value.player, dependencies),
    ),
  }
  return c.json(nativeSession, status)
}
