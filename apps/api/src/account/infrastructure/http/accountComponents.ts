import { NativeSessionSchema, SignInRequestSchema, SignUpRequestSchema } from '@mygame/contracts'
import {
  type ResponseDeclaration,
  refusalResponse,
} from '../../../platform/infrastructure/http/refusalResponse'
import { jsonResponse } from '../../../platform/infrastructure/http/responseDeclarations'
import { PlayerComponent } from './playerComponent'

export const playerResponse = (description: string): ResponseDeclaration =>
  jsonResponse(description, PlayerComponent)

export const NativeSessionComponent = NativeSessionSchema.extend({ player: PlayerComponent }).meta({
  id: 'NativeSession',
})

export const SignInRequestComponent = SignInRequestSchema.meta({ id: 'SignInRequest' })

export const SignUpRequestComponent = SignUpRequestSchema.meta({ id: 'SignUpRequest' })

export const signUpRefusals = {
  400: refusalResponse(
    'MalformedEmail or WeakPassword; any other malformed body answers an empty body.',
  ),
  409: refusalResponse('EmailTaken.'),
}
