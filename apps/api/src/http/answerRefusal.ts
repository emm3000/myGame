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
  QueueFull: 'Ya no caben más obras en espera. Espera a que avance alguna.',
  UpgradeNotFound: 'Esa obra ya no está en tu cola. No queda nada que cancelar.',
  InsufficientResources: 'No tienes recursos suficientes para esa obra.',
  NotEnoughPeasants: 'No tienes campesinos libres suficientes para esa obra.',
  BlankFiefName: 'Tu feudo necesita un nombre. Escribe uno que no esté en blanco.',
  StudySlotBusy: 'La biblioteca ya tiene un estudio en marcha. Espera a que termine.',
  LibraryLevelTooLow: 'Tu biblioteca aún no guarda los tratados de ese estudio. Mejórala primero.',
  ArtMaxLevelReached: 'Ese arte ya está en su nivel más alto.',
  StudyNotFound: 'La biblioteca ya no tiene ese estudio en marcha. No queda nada que cancelar.',
  BarracksNotBuilt: 'Tu feudo aún no tiene cuartel. Levántalo primero.',
  RecruitSlotBusy: 'El cuartel ya tiene una leva en marcha. Espera a que termine.',
  ProvinceNotFound: 'Esa provincia no está en el mapa. Vuelve a la tuya.',
  TokenInvalid: 'Ese enlace no vale: ha caducado, ya se ha usado o nunca se envió. Pide otro.',
  MailNotSent: 'No hemos podido enviar el correo. Vuelve a intentarlo en un momento.',
}

const internalFailure: RefusalAnswer = { status: 500 }

const answers: Readonly<Record<Refusal['kind'], RefusalAnswer>> = {
  InvalidCredentials: { status: 401, kind: 'InvalidCredentials' },
  EmailTaken: { status: 409, kind: 'EmailTaken' },
  WeakPassword: { status: 400, kind: 'WeakPassword' },
  FiefNotFound: { status: 404, kind: 'FiefNotFound' },
  UnknownBuilding: { status: 400, kind: 'UnknownBuilding' },
  MaxLevelReached: { status: 409, kind: 'MaxLevelReached' },
  QueueFull: { status: 409, kind: 'QueueFull' },
  UpgradeNotFound: { status: 409, kind: 'UpgradeNotFound' },
  InsufficientResources: { status: 409, kind: 'InsufficientResources' },
  NotEnoughPeasants: { status: 409, kind: 'NotEnoughPeasants' },
  MalformedRequest: { status: 400 },
  BlankFiefName: { status: 400, kind: 'BlankFiefName' },
  StudySlotBusy: { status: 409, kind: 'StudySlotBusy' },
  LibraryLevelTooLow: { status: 409, kind: 'LibraryLevelTooLow' },
  ArtMaxLevelReached: { status: 409, kind: 'ArtMaxLevelReached' },
  StudyNotFound: { status: 409, kind: 'StudyNotFound' },
  SignedOut: { status: 401 },
  TokenInvalid: { status: 400, kind: 'TokenInvalid' },
  MailNotSent: { status: 503, kind: 'MailNotSent' },
  CoordinatesTaken: { status: 409 },
  PlayerAlreadyHoldsFief: { status: 409 },
  ProvinceNotFound: { status: 404, kind: 'ProvinceNotFound' },
  NegativeDuration: internalFailure,
  FractionalDuration: internalFailure,
  InstantBeforeStored: internalFailure,
  NegativeResourceAmount: internalFailure,
  NegativeResourceRate: internalFailure,
  UnknownBuildingLevel: internalFailure,
  UnknownArtLevel: internalFailure,
  InvalidArtLevel: internalFailure,
  InvalidUnitCount: internalFailure,
  InvalidUnitDuration: internalFailure,
  BarracksNotBuilt: { status: 409, kind: 'BarracksNotBuilt' },
  RecruitSlotBusy: { status: 409, kind: 'RecruitSlotBusy' },
  RecruitOrderNotFound: internalFailure,
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
