import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { SignUpRequestSchema } from '@mygame/contracts'
import { answerRefusal } from '#platform/infrastructure/http/answerRefusal'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { requestRefusalOf } from '#platform/infrastructure/http/requestRefusalOf'
import { jsonBody } from '#platform/infrastructure/http/responseDeclarations'
import { type SignUpDependencies, signUp } from '../../application/signUp'
import { playerResponse, SignUpRequestComponent, signUpRefusals } from './accountComponents'
import { accountIssues } from './accountIssues'
import { type AnswerSignedInDependencies, answerSignedIn } from './answerSignedIn'

export const signUpDeclaration = createRoute({
  method: 'post',
  path: '/auth/sign-up',
  request: { body: jsonBody(SignUpRequestComponent) },
  responses: {
    201: playerResponse('The new player, signed in through the session cookie.'),
    ...signUpRefusals,
  },
})

export type SignUpRouteDependencies = SignUpDependencies & AnswerSignedInDependencies

export const signUpRoute = (routes: OpenAPIHono, dependencies: SignUpRouteDependencies): void => {
  routes.openAPIRegistry.registerPath(signUpDeclaration)
  routes.on(signUpDeclaration.method, signUpDeclaration.path, async (c) => {
    const request = SignUpRequestSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return answerRefusal(c, requestRefusalOf(accountIssues, request.error.issues))
    }
    return answerSignedIn(c, await signUp(request.data, dependencies), 201, dependencies)
  })
}
