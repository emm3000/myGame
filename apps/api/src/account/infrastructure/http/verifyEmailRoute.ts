import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { VerifyEmailRequestSchema } from '@mygame/contracts'
import { answerRefusal } from '../../../platform/infrastructure/http/answerRefusal'
import { readJsonBody } from '../../../platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '../../../platform/infrastructure/http/refusalResponse'
import { jsonBody } from '../../../platform/infrastructure/http/responseDeclarations'
import { type VerifyEmailDependencies, verifyEmail } from '../../application/verifyEmail'
import { answerDone } from './answerDone'

export const verifyEmailDeclaration = createRoute({
  method: 'post',
  path: '/auth/verify-email',
  request: { body: jsonBody(VerifyEmailRequestSchema.meta({ id: 'VerifyEmailRequest' })) },
  responses: {
    204: {
      description:
        'The email is verified; a link redeemed earlier answers the same inside its 24 hours.',
    },
    400: refusalResponse('TokenInvalid; a malformed body answers an empty body.'),
  },
})

export const verifyEmailRoute = (
  routes: OpenAPIHono,
  dependencies: VerifyEmailDependencies,
): void => {
  routes.openAPIRegistry.registerPath(verifyEmailDeclaration)
  routes.on(verifyEmailDeclaration.method, verifyEmailDeclaration.path, async (c) => {
    const request = VerifyEmailRequestSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return answerRefusal(c, { kind: 'MalformedRequest' })
    }
    return answerDone(c, await verifyEmail(request.data, dependencies))
  })
}
