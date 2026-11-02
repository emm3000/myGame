import { createRoute } from '@hono/zod-openapi'
import {
  ForgotPasswordRequestSchema,
  NativeSessionSchema,
  PlayerSchema,
  ResetPasswordRequestSchema,
  SignInRequestSchema,
  SignUpRequestSchema,
  VerifyEmailRequestSchema,
} from '@mygame/contracts'
import { type ResponseDeclaration, refusalResponse } from '../http/refusalResponse'
import { jsonBody, jsonResponse, signedInRoute } from '../http/responseDeclarations'

const PlayerComponent = PlayerSchema.meta({ id: 'Player' })

const playerResponse = (description: string): ResponseDeclaration =>
  jsonResponse(description, PlayerComponent)

const NativeSessionComponent = NativeSessionSchema.extend({ player: PlayerComponent }).meta({
  id: 'NativeSession',
})

const SignInRequestComponent = SignInRequestSchema.meta({ id: 'SignInRequest' })

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
      409: refusalResponse(
        'EmailTaken; CoordinatesTaken and PlayerAlreadyHoldsFief, the founding races, answer an empty body.',
      ),
    },
  }),
  signIn: createRoute({
    method: 'post',
    path: '/sign-in',
    request: { body: jsonBody(SignInRequestComponent) },
    responses: {
      200: playerResponse('The player, signed in through the session cookie.'),
      401: refusalResponse('InvalidCredentials, a malformed body included.'),
    },
  }),
  nativeSignIn: createRoute({
    method: 'post',
    path: '/sign-in/native',
    request: { body: jsonBody(SignInRequestComponent) },
    responses: {
      200: jsonResponse(
        'The player and the session token, sent as an Authorization bearer; no cookie is set.',
        NativeSessionComponent,
      ),
      401: refusalResponse('InvalidCredentials, a malformed body included.'),
    },
  }),
  signOut: createRoute(
    signedInRoute({
      method: 'post',
      path: '/sign-out',
      responses: {
        204: { description: 'The session is closed and its cookie cleared.' },
      },
    }),
  ),
  session: createRoute(
    signedInRoute({
      method: 'get',
      path: '/session',
      responses: {
        200: playerResponse('The signed-in player; the session is renewed.'),
      },
    }),
  ),
  verifyEmail: createRoute({
    method: 'post',
    path: '/verify-email',
    request: { body: jsonBody(VerifyEmailRequestSchema.meta({ id: 'VerifyEmailRequest' })) },
    responses: {
      204: { description: 'The email is verified.' },
      400: refusalResponse('TokenInvalid; a malformed body answers an empty body.'),
    },
  }),
  resendVerification: createRoute(
    signedInRoute({
      method: 'post',
      path: '/verify-email/resend',
      responses: {
        204: { description: 'The verification mail is sent, or the email is already verified.' },
        503: refusalResponse('MailNotSent.'),
      },
    }),
  ),
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
