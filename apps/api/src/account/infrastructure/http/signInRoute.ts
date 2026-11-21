import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { SignInRequestSchema } from '@mygame/contracts'
import { answerRefusal } from '../../../platform/infrastructure/http/answerRefusal'
import { readJsonBody } from '../../../platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '../../../platform/infrastructure/http/refusalResponse'
import { jsonBody } from '../../../platform/infrastructure/http/responseDeclarations'
import { type SignInDependencies, signIn } from '../../application/signIn'
import { playerResponse, SignInRequestComponent } from './accountComponents'
import { type AnswerSignedInDependencies, answerSignedIn } from './answerSignedIn'

export const signInDeclaration = createRoute({
  method: 'post',
  path: '/auth/sign-in',
  request: { body: jsonBody(SignInRequestComponent) },
  responses: {
    200: playerResponse('The player, signed in through the session cookie.'),
    401: refusalResponse('InvalidCredentials, a malformed body included.'),
  },
})

export type SignInRouteDependencies = SignInDependencies & AnswerSignedInDependencies

export const signInRoute = (routes: OpenAPIHono, dependencies: SignInRouteDependencies): void => {
  routes.openAPIRegistry.registerPath(signInDeclaration)
  routes.on(signInDeclaration.method, signInDeclaration.path, async (c) => {
    const request = SignInRequestSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return answerRefusal(c, { kind: 'InvalidCredentials' })
    }
    return answerSignedIn(c, await signIn(request.data, dependencies), 200, dependencies)
  })
}
