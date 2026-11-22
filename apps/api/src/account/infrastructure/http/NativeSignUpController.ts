import { createRoute } from '@hono/zod-openapi'
import { SignUpRequestSchema } from '@mygame/contracts'
import type { SignUp } from '@mygame/domain'
import type { Context } from 'hono'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { requestRefusalOf } from '#platform/infrastructure/http/requestRefusalOf'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody, jsonResponse } from '#platform/infrastructure/http/responseDeclarations'
import { NativeSessionComponent, SignUpRequestComponent, signUpRefusals } from './accountComponents'
import { accountIssues } from './accountIssues'
import { type RespondNativeSessionDependencies, respondNativeSession } from './respondNativeSession'

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

export type NativeSignUpControllerDependencies = RespondNativeSessionDependencies & {
  readonly signUp: SignUp
}

export class NativeSignUpController {
  constructor(private readonly dependencies: NativeSignUpControllerDependencies) {}

  async handle(c: Context): Promise<Response> {
    const request = SignUpRequestSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return respondRefusal(c, requestRefusalOf(accountIssues, request.error.issues))
    }
    const signedIn = await this.dependencies.signUp.execute(request.data)
    return respondNativeSession(c, signedIn, 201, this.dependencies)
  }
}
