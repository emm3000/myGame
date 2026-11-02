import { createRoute, type RouteConfig } from '@hono/zod-openapi'
import {
  ForgotPasswordRequestSchema,
  PlayerSchema,
  ResetPasswordRequestSchema,
  SignInRequestSchema,
  SignUpRequestSchema,
  VerifyEmailRequestSchema,
} from '@mygame/contracts'
import type { ZodType } from 'zod'
import { type ResponseDeclaration, refusalResponse } from '../http/refusalResponse'

const PlayerComponent = PlayerSchema.meta({ id: 'Player' })

type BodyDeclaration = NonNullable<NonNullable<RouteConfig['request']>['body']>

const jsonBody = (schema: ZodType): BodyDeclaration => ({
  required: true,
  content: { 'application/json': { schema } },
})

const playerResponse = (description: string): ResponseDeclaration => ({
  description,
  content: { 'application/json': { schema: PlayerComponent } },
})

const signedOut: ResponseDeclaration = {
  description: 'No live session cookie. Empty body.',
}

export const authDeclarations = {
  signUp: createRoute({
    method: 'post',
    path: '/sign-up',
    request: { body: jsonBody(SignUpRequestSchema.meta({ id: 'SignUpRequest' })) },
    responses: {
      201: playerResponse('The new player, signed in through the session cookie.'),
      400: refusalResponse(
        'WeakPassword or BlankFiefName; a malformed body answers an empty body.',
      ),
      409: refusalResponse('EmailTaken.'),
    },
  }),
  signIn: createRoute({
    method: 'post',
    path: '/sign-in',
    request: { body: jsonBody(SignInRequestSchema.meta({ id: 'SignInRequest' })) },
    responses: {
      200: playerResponse('The player, signed in through the session cookie.'),
      401: refusalResponse('InvalidCredentials, a malformed body included.'),
    },
  }),
  signOut: createRoute({
    method: 'post',
    path: '/sign-out',
    responses: {
      204: { description: 'The session is closed and its cookie cleared.' },
      401: signedOut,
    },
  }),
  session: createRoute({
    method: 'get',
    path: '/session',
    responses: {
      200: playerResponse('The signed-in player; the session is renewed.'),
      401: signedOut,
    },
  }),
  verifyEmail: createRoute({
    method: 'post',
    path: '/verify-email',
    request: { body: jsonBody(VerifyEmailRequestSchema.meta({ id: 'VerifyEmailRequest' })) },
    responses: {
      204: { description: 'The email is verified.' },
      400: refusalResponse('TokenInvalid; a malformed body answers an empty body.'),
    },
  }),
  resendVerification: createRoute({
    method: 'post',
    path: '/verify-email/resend',
    responses: {
      204: { description: 'The verification mail is sent, or the email is already verified.' },
      401: signedOut,
      503: refusalResponse('MailNotSent.'),
    },
  }),
  forgotPassword: createRoute({
    method: 'post',
    path: '/forgot-password',
    request: {
      body: jsonBody(ForgotPasswordRequestSchema.meta({ id: 'ForgotPasswordRequest' })),
    },
    responses: {
      202: { description: 'Accepted for any well-formed email. Empty body.' },
      400: { description: 'A malformed body. Empty body.' },
    },
  }),
  resetPassword: createRoute({
    method: 'post',
    path: '/reset-password',
    request: {
      body: jsonBody(ResetPasswordRequestSchema.meta({ id: 'ResetPasswordRequest' })),
    },
    responses: {
      204: { description: 'The password is replaced and every session closed.' },
      400: refusalResponse('TokenInvalid or WeakPassword; a malformed body answers an empty body.'),
    },
  }),
}
