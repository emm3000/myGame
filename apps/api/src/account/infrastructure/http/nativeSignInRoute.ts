import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { SignInRequestSchema } from '@mygame/contracts'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { answerRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody, jsonResponse } from '#platform/infrastructure/http/responseDeclarations'
import type { ReadChromePhaseDependencies } from '../../application/readChromePhase'
import { type SignInDependencies, signIn } from '../../application/signIn'
import { NativeSessionComponent, SignInRequestComponent } from './accountComponents'
import { answerNativeSession } from './respondSignedIn'

export const nativeSignInDeclaration = createRoute({
  method: 'post',
  path: '/auth/sign-in/native',
  request: { body: jsonBody(SignInRequestComponent) },
  responses: {
    200: jsonResponse(
      'The player and the session token, sent as an Authorization bearer; no cookie is set.',
      NativeSessionComponent,
    ),
    401: refusalResponse('InvalidCredentials, a malformed body included.'),
  },
})

export type NativeSignInRouteDependencies = SignInDependencies & ReadChromePhaseDependencies

export const nativeSignInRoute = (
  routes: OpenAPIHono,
  dependencies: NativeSignInRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(nativeSignInDeclaration)
  routes.on(nativeSignInDeclaration.method, nativeSignInDeclaration.path, async (c) => {
    const request = SignInRequestSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return answerRefusal(c, { kind: 'InvalidCredentials' })
    }
    return answerNativeSession(c, await signIn(request.data, dependencies), 200, dependencies)
  })
}
