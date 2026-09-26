import type { ApiError, ApiErrorKind } from '@mygame/contracts'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { Refusal } from './Refusal'

type RefusalAnswer = {
  readonly status: ContentfulStatusCode
  readonly kind?: ApiErrorKind
}

const messages: Readonly<Record<ApiErrorKind, string>> = {
  InvalidCredentials: 'El correo o la contraseña no son correctos.',
  EmailTaken: 'Ya hay una cuenta con ese correo. Entra con ella o usa otro correo.',
  WeakPassword: 'Tu contraseña necesita al menos 8 caracteres.',
  FiefNotFound: 'No encontramos tus tierras.',
  UnknownBuilding: 'Ese edificio no existe.',
  MaxLevelReached: 'Ese edificio ya está en su nivel más alto.',
  SlotBusy: 'Ya tienes una obra en marcha. Espera a que termine.',
  SlotIdle: 'Tu obra ya ha terminado. No queda nada que cancelar.',
  InsufficientResources: 'No tienes recursos suficientes para esa obra.',
  NotEnoughPeasants: 'No tienes campesinos libres suficientes para esa obra.',
  BlankFiefName: 'Tu feudo necesita un nombre. Escribe uno que no esté en blanco.',
}

const internalFailure: RefusalAnswer = { status: 500 }

const answers: Readonly<Record<Refusal['kind'], RefusalAnswer>> = {
  InvalidCredentials: { status: 401, kind: 'InvalidCredentials' },
  EmailTaken: { status: 409, kind: 'EmailTaken' },
  WeakPassword: { status: 400, kind: 'WeakPassword' },
  FiefNotFound: { status: 404, kind: 'FiefNotFound' },
  UnknownBuilding: { status: 400, kind: 'UnknownBuilding' },
  MaxLevelReached: { status: 409, kind: 'MaxLevelReached' },
  SlotBusy: { status: 409, kind: 'SlotBusy' },
  SlotIdle: { status: 409, kind: 'SlotIdle' },
  InsufficientResources: { status: 409, kind: 'InsufficientResources' },
  NotEnoughPeasants: { status: 409, kind: 'NotEnoughPeasants' },
  MalformedRequest: { status: 400 },
  BlankFiefName: { status: 400, kind: 'BlankFiefName' },
  SignedOut: { status: 401 },
  CoordinatesTaken: { status: 409 },
  PlayerAlreadyHoldsFief: { status: 409 },
  NegativeDuration: internalFailure,
  InstantBeforeStored: internalFailure,
  NegativeResourceAmount: internalFailure,
  NegativeResourceRate: internalFailure,
  UnknownBuildingLevel: internalFailure,
  NegativeFreePeasants: internalFailure,
  InvalidCoordinates: internalFailure,
  InvalidPlotsPerProvince: internalFailure,
  InvalidBuildingLevel: internalFailure,
  SlotFinishesBeforeStored: internalFailure,
  SlotStartsAfterFinish: internalFailure,
}

export const answerRefusal = (c: Context, refusal: Refusal): Response => {
  const { status, kind } = answers[refusal.kind]
  if (kind === undefined) {
    return c.body(null, status)
  }
  const body: ApiError = { kind, message: messages[kind] }
  return c.json(body, status)
}
