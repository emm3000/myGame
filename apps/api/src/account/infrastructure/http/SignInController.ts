import { createRoute } from '@hono/zod-openapi'
import { SignInRequestSchema } from '@mygame/contracts'
import type { SignIn } from '@mygame/domain'
import type { Context } from 'hono'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody } from '#platform/infrastructure/http/responseDeclarations'
import { playerResponse, SignInRequestComponent } from './accountComponents'
import { type RespondSignedInDependencies, respondSignedIn } from './respondSignedIn'

export const signInDeclaration = createRoute({
  method: 'post',
  path: '/auth/sign-in',
  request: { body: jsonBody(SignInRequestComponent) },
  responses: {
    200: playerResponse('The player, signed in through the session cookie.'),
    401: refusalResponse('InvalidCredentials, a malformed body included.'),
  },
})

export type SignInControllerDependencies = RespondSignedInDependencies & {
  readonly signIn: SignIn
}

export class SignInController {
  constructor(private readonly dependencies: SignInControllerDependencies) {}

  async handle(c: Context): Promise<Response> {
    const request = SignInRequestSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return respondRefusal(c, { kind: 'InvalidCredentials' })
    }
    const signedIn = await this.dependencies.signIn.execute(request.data)
    return respondSignedIn(c, signedIn, 200, this.dependencies)
  }
}
