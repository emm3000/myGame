import { createRoute } from '@hono/zod-openapi'
import { SignUpRequestSchema } from '@mygame/contracts'
import type { SignUp } from '@mygame/domain'
import type { Context } from 'hono'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { requestRefusalOf } from '#platform/infrastructure/http/requestRefusalOf'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody } from '#platform/infrastructure/http/responseDeclarations'
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

export type SignUpControllerDependencies = RespondSignedInDependencies & {
  readonly signUp: SignUp
}

export class SignUpController {
  constructor(private readonly dependencies: SignUpControllerDependencies) {}

  async handle(c: Context): Promise<Response> {
    const request = SignUpRequestSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return respondRefusal(c, requestRefusalOf(accountIssues, request.error.issues))
    }
    const signedIn = await this.dependencies.signUp.execute(request.data)
    return respondSignedIn(c, signedIn, 201, this.dependencies)
  }
}
