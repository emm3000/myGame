import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { SignUpRequestSchema } from '@mygame/contracts'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { requestRefusalOf } from '#platform/infrastructure/http/requestRefusalOf'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody } from '#platform/infrastructure/http/responseDeclarations'
import { type SignUpDependencies, signUp } from '../../application/signUp'
import { playerResponse, SignUpRequestComponent, signUpRefusals } from './accountComponents'
import { accountIssues } from './accountIssues'
import { type RespondSignedInDependencies, respondSignedIn } from './respondSignedIn'

export const signUpDeclaration = createRoute({
  method: 'post',
  path: '/auth/sign-up',
  request: { body: jsonBody(SignUpRequestComponent) },
  responses: {
    201: playerResponse('The new player, signed in through the session cookie.'),
    ...signUpRefusals,
  },
})

export type SignUpRouteDependencies = SignUpDependencies & RespondSignedInDependencies

export const signUpRoute = (routes: OpenAPIHono, dependencies: SignUpRouteDependencies): void => {
  routes.openAPIRegistry.registerPath(signUpDeclaration)
  routes.on(signUpDeclaration.method, signUpDeclaration.path, async (c) => {
    const request = SignUpRequestSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return respondRefusal(c, requestRefusalOf(accountIssues, request.error.issues))
    }
    return respondSignedIn(c, await signUp(request.data, dependencies), 201, dependencies)
  })
}
