import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { SignUpRequestSchema } from '@mygame/contracts'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { requestRefusalOf } from '#platform/infrastructure/http/requestRefusalOf'
import { answerRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody, jsonResponse } from '#platform/infrastructure/http/responseDeclarations'
import type { ReadChromePhaseDependencies } from '../../application/readChromePhase'
import { type SignUpDependencies, signUp } from '../../application/signUp'
import { NativeSessionComponent, SignUpRequestComponent, signUpRefusals } from './accountComponents'
import { accountIssues } from './accountIssues'
import { answerNativeSession } from './respondSignedIn'

export const nativeSignUpDeclaration = createRoute({
  method: 'post',
  path: '/auth/sign-up/native',
  request: { body: jsonBody(SignUpRequestComponent) },
  responses: {
    201: jsonResponse(
      'The new player and the session token, sent as an Authorization bearer; no cookie is set.',
      NativeSessionComponent,
    ),
    ...signUpRefusals,
  },
})

export type NativeSignUpRouteDependencies = SignUpDependencies & ReadChromePhaseDependencies

export const nativeSignUpRoute = (
  routes: OpenAPIHono,
  dependencies: NativeSignUpRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(nativeSignUpDeclaration)
  routes.on(nativeSignUpDeclaration.method, nativeSignUpDeclaration.path, async (c) => {
    const request = SignUpRequestSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return answerRefusal(c, requestRefusalOf(accountIssues, request.error.issues))
    }
    return answerNativeSession(c, await signUp(request.data, dependencies), 201, dependencies)
  })
}
