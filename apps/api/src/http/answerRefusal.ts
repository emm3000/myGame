import type { ApiError, ApiErrorKind } from '@mygame/contracts'
import type { UnitKind } from '@mygame/domain'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { Refusal } from './Refusal'

type UnitsShortAtHome = Extract<Refusal, { readonly kind: 'NotEnoughUnitsAtHome' }>

type BarracksTooLow = Extract<Refusal, { readonly kind: 'BarracksTooLow' }>

type SlottedKind = UnitsShortAtHome['kind'] | BarracksTooLow['kind']

type SlotlessKind = Exclude<ApiErrorKind, SlottedKind>

type SlotlessRefusalKind = Exclude<Refusal['kind'], SlottedKind>

type RefusalAnswer = {
  readonly status: ContentfulStatusCode
  readonly kind?: SlotlessKind
}

const unitLabels: Readonly<
  Record<UnitKind, { readonly singular: string; readonly plural: string }>
> = {
  infantry: { singular: 'infante', plural: 'infantes' },
  cavalry: { singular: 'jinete', plural: 'jinetes' },
  settler: { singular: 'colono', plural: 'colonos' },
}

const countedUnits = (unit: UnitKind, count: number): string =>
  `${count} ${count === 1 ? unitLabels[unit].singular : unitLabels[unit].plural}`

const unitsShortLineOf = ({ unit, count, atHome }: UnitsShortAtHome): string =>
  `Necesitas ${countedUnits(unit, count)} en casa y tienes ${atHome}. Ajusta la marcha.`

const barracksTooLowLineOf = ({ unit, requiredBarracksLevel }: BarracksTooLow): string =>
  `Tu cuartel aún no llega al nivel ${requiredBarracksLevel} que piden los ${unitLabels[unit].plural}. Mejóralo primero.`

const messages: Readonly<Record<SlotlessKind, string>> = {
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
  RecruitOrderNotFound: 'El cuartel ya no tiene esa leva en marcha. No queda nada que cancelar.',
  PlotHeld: 'Esa parcela ya tiene feudo. Elige una libre.',
  PlotHasCamp: 'Esa parcela tiene un campamento de bandidos. Atácalo o forrajea en otra.',
  PlotHasNoCamp: 'Esa parcela no tiene campamento de bandidos. Elige una que lo tenga.',
  MarchToOwnPlot: 'Esa parcela es tu feudo. Envía la marcha a otra.',
  MarchSlotBusy: 'El cuartel ya tiene una marcha en curso. Espera a que vuelva.',
  StayOutOfRange: 'Una marcha forrajea de 1 a 8 horas enteras. Ajusta las horas.',
  MarchTargetOutOfBounds: 'Esa parcela no está en el mapa. Elige una que lo esté.',
  MarchNotFound: 'El cuartel ya no tiene esa marcha en curso. No queda nada que retirar.',
  MarchAlreadyReturning: 'Esa marcha ya viene de vuelta. Espera a que llegue.',
  UnitUnfitForOrder: 'Un colono no forrajea ni ataca. Envíalo a fundar un feudo.',
  ProvinceNotFound: 'Esa provincia no está en el mapa. Vuelve a la tuya.',
  TokenInvalid: 'Ese enlace no vale: ha caducado, ya se ha usado o nunca se envió. Pide otro.',
  MailNotSent: 'No hemos podido enviar el correo. Vuelve a intentarlo en un momento.',
}

const internalFailure: RefusalAnswer = { status: 500 }

const answers: Readonly<Record<SlotlessRefusalKind, RefusalAnswer>> = {
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
  RecruitOrderNotFound: { status: 409, kind: 'RecruitOrderNotFound' },
  NegativeFreePeasants: internalFailure,
  InvalidCoordinates: internalFailure,
  InvalidPlotsPerProvince: internalFailure,
  InvalidBuildingLevel: internalFailure,
  SlotFinishesBeforeStored: internalFailure,
  SlotStartsAfterFinish: internalFailure,
  StayOutOfRange: { status: 409, kind: 'StayOutOfRange' },
  MarchSlotBusy: { status: 409, kind: 'MarchSlotBusy' },
  MarchNotFound: { status: 409, kind: 'MarchNotFound' },
  MarchAlreadyReturning: { status: 409, kind: 'MarchAlreadyReturning' },
  MarchTargetOutOfBounds: { status: 409, kind: 'MarchTargetOutOfBounds' },
  MarchToOwnPlot: { status: 409, kind: 'MarchToOwnPlot' },
  PlotHeld: { status: 409, kind: 'PlotHeld' },
  PlotHasCamp: { status: 409, kind: 'PlotHasCamp' },
  PlotHasNoCamp: { status: 409, kind: 'PlotHasNoCamp' },
  UnitUnfitForOrder: { status: 409, kind: 'UnitUnfitForOrder' },
  InvalidCamp: internalFailure,
  InvalidLootPercent: internalFailure,
}

export const answerRefusal = (c: Context, refusal: Refusal): Response => {
  if (refusal.kind === 'NotEnoughUnitsAtHome') {
    const body: ApiError = { kind: refusal.kind, message: unitsShortLineOf(refusal) }
    return c.json(body, 409)
  }
  if (refusal.kind === 'BarracksTooLow') {
    const body: ApiError = { kind: refusal.kind, message: barracksTooLowLineOf(refusal) }
    return c.json(body, 409)
  }
  const { status, kind } = answers[refusal.kind]
  if (kind === undefined) {
    return c.body(null, status)
  }
  const body: ApiError = { kind, message: messages[kind] }
  return c.json(body, status)
}
