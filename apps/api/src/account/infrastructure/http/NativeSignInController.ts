import { createRoute } from '@hono/zod-openapi'
import { SignInRequestSchema } from '@mygame/contracts'
import type { SignIn } from '@mygame/domain'
import type { Context } from 'hono'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody, jsonResponse } from '#platform/infrastructure/http/responseDeclarations'
import { NativeSessionComponent, SignInRequestComponent } from './accountComponents'
import { type RespondNativeSessionDependencies, respondNativeSession } from './respondSignedIn'

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

export type NativeSignInControllerDependencies = RespondNativeSessionDependencies & {
  readonly signIn: SignIn
}

export class NativeSignInController {
  constructor(private readonly dependencies: NativeSignInControllerDependencies) {}

  async handle(c: Context): Promise<Response> {
    const request = SignInRequestSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return respondRefusal(c, { kind: 'InvalidCredentials' })
    }
    const signedIn = await this.dependencies.signIn.execute(request.data)
    return respondNativeSession(c, signedIn, 200, this.dependencies)
  }
}
