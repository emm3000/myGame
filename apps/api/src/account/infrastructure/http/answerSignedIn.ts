import type { NativeSession } from '@mygame/contracts'
import type { Result } from '@mygame/domain'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { Refusal } from '#platform/application/Refusal'
import { answerRefusal } from '#platform/infrastructure/http/answerRefusal'
import type { ReadChromePhaseDependencies } from '../../application/readChromePhase'
import type { SignedIn } from '../../application/SignedIn'
import { presentPlayer } from './presentPlayer'
import { writeSessionCookie } from './sessionCookie'

export type AnswerSignedInDependencies = ReadChromePhaseDependencies & {
  readonly isSessionCookieSecure: boolean
}

export const answerSignedIn = async (
  c: Context,
  signedIn: Result<SignedIn, Refusal>,
  status: ContentfulStatusCode,
  dependencies: AnswerSignedInDependencies,
): Promise<Response> => {
  if (!signedIn.ok) {
    return answerRefusal(c, signedIn.error)
  }
  writeSessionCookie(c, signedIn.value.session, dependencies.isSessionCookieSecure)
  return c.json(await presentPlayer(signedIn.value.player, dependencies), status)
}

export const answerNativeSession = async (
  c: Context,
  signedIn: Result<SignedIn, Refusal>,
  status: ContentfulStatusCode,
  dependencies: ReadChromePhaseDependencies,
): Promise<Response> => {
  if (!signedIn.ok) {
    return answerRefusal(c, signedIn.error)
  }
  const nativeSession: NativeSession = {
    token: signedIn.value.session.token,
    player: await presentPlayer(signedIn.value.player, dependencies),
  }
  return c.json(nativeSession, status)
}
