import type { ApiError, ApiErrorKind } from '@mygame/contracts'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { Refusal } from './Refusal'

declare module 'hono' {
  interface ContextVariableMap {
    readonly refusalKind?: Refusal['kind']
  }
}

type SlottedKind = Extract<ApiError, { readonly params: unknown }>['kind']

type SlotlessKind = Exclude<ApiErrorKind, SlottedKind>

type SlotlessRefusalKind = Exclude<Refusal['kind'], SlottedKind>

type RefusalAnswer = {
  readonly status: ContentfulStatusCode
  readonly kind?: SlotlessKind
}

type RefusalBody = {
  readonly status: ContentfulStatusCode
  readonly body?: ApiError
}

const internalFailure: RefusalAnswer = { status: 500 }

const answers: Readonly<Record<SlotlessRefusalKind, RefusalAnswer>> = {
  InvalidCredentials: { status: 401, kind: 'InvalidCredentials' },
  EmailTaken: { status: 409, kind: 'EmailTaken' },
  WeakPassword: { status: 400, kind: 'WeakPassword' },
  MalformedEmail: { status: 400, kind: 'MalformedEmail' },
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
  InvalidTownAddress: internalFailure,
  BlankTownName: { status: 400, kind: 'BlankTownName' },
  PlayerAlreadyHoldsTown: { status: 409, kind: 'PlayerAlreadyHoldsTown' },
  SiteTaken: { status: 409 },
  InvalidTownStock: internalFailure,
  InvalidTownBuildingLevel: internalFailure,
  UnknownTownBuildingLevel: internalFailure,
  TownNotFound: { status: 404, kind: 'TownNotFound' },
  FractionalResourceAmount: internalFailure,
  ProvinceNotFound: { status: 404, kind: 'ProvinceNotFound' },
  NegativeDuration: internalFailure,
  FractionalDuration: internalFailure,
  InstantBeforeStored: internalFailure,
  InvalidMemoryCard: internalFailure,
  ReviewBeforeLastReview: internalFailure,
  UnknownMemoryStep: internalFailure,
  UnknownWord: { status: 409, kind: 'UnknownWord' },
  WordNotHeld: { status: 409, kind: 'WordNotHeld' },
  ReviewNotDue: { status: 409, kind: 'ReviewNotDue' },
  HintOnRecognition: { status: 409, kind: 'HintOnRecognition' },
  UnknownChoice: { status: 409, kind: 'UnknownChoice' },
  LessonNotFound: { status: 404 },
  LessonAlreadyStudied: { status: 409, kind: 'LessonAlreadyStudied' },
  LessonUnderStudy: { status: 409, kind: 'LessonUnderStudy' },
  LessonStudyNotFound: { status: 409, kind: 'LessonStudyNotFound' },
  LessonSchoolTooLow: { status: 409, kind: 'LessonSchoolTooLow' },
  LearningCapReached: { status: 409, kind: 'LearningCapReached' },
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
  InvalidCellsPerRow: internalFailure,
  InvalidBuildingLevel: internalFailure,
  SlotFinishesBeforeStored: internalFailure,
  SlotStartsAfterFinish: internalFailure,
  MarchSlotBusy: { status: 409, kind: 'MarchSlotBusy' },
  MarchNotFound: { status: 409, kind: 'MarchNotFound' },
  MarchAlreadyReturning: { status: 409, kind: 'MarchAlreadyReturning' },
  MarchTargetOutOfBounds: { status: 409, kind: 'MarchTargetOutOfBounds' },
  MarchToOwnPlot: { status: 409, kind: 'MarchToOwnPlot' },
  PlotHeld: { status: 409, kind: 'PlotHeld' },
  PlotHasCamp: { status: 409, kind: 'PlotHasCamp' },
  PlotHasNoCamp: { status: 409, kind: 'PlotHasNoCamp' },
  UnitUnfitForOrder: { status: 409, kind: 'UnitUnfitForOrder' },
  PlotReserved: { status: 409, kind: 'PlotReserved' },
  EmptyCargo: { status: 409, kind: 'EmptyCargo' },
  InvalidCamp: internalFailure,
  InvalidLootPercent: internalFailure,
  InvalidMarchStay: internalFailure,
}

const slotlessBodyOf = (kind: SlotlessRefusalKind): RefusalBody => {
  const answer = answers[kind]
  return answer.kind === undefined
    ? { status: answer.status }
    : { status: answer.status, body: { kind: answer.kind } }
}

const refusalBodyOf = (refusal: Refusal): RefusalBody => {
  switch (refusal.kind) {
    case 'NotEnoughUnitsAtHome': {
      const { kind, unit, count, atHome } = refusal
      return { status: 409, body: { kind, params: { unit, count, atHome } } }
    }
    case 'BarracksTooLow': {
      const { kind, unit, requiredBarracksLevel } = refusal
      return { status: 409, body: { kind, params: { unit, requiredBarracksLevel } } }
    }
    case 'FiefCapReached':
      return { status: 409, body: { kind: refusal.kind, params: { cap: refusal.cap } } }
    case 'CargoAboveCarry': {
      const { kind, cargo, carry } = refusal
      return { status: 409, body: { kind, params: { cargo, carry } } }
    }
    case 'StayOutOfRange': {
      const { kind, maxStayHours } = refusal
      return { status: 409, body: { kind, params: { maxStayHours } } }
    }
    case 'WaitingListFull':
      return { status: 409, body: { kind: refusal.kind, params: { cap: refusal.cap } } }
    case 'NotEnoughPeople': {
      const { kind, requiredPeople, freePeople } = refusal
      return { status: 409, body: { kind, params: { requiredPeople, freePeople } } }
    }
    case 'NotEnoughResources':
      return { status: 409, body: { kind: refusal.kind, params: { missing: refusal.missing } } }
    case 'TopLevelReached':
    case 'BuildingWorkNotFound': {
      const { kind, building, level } = refusal
      return { status: 409, body: { kind, params: { building, level } } }
    }
    default:
      return slotlessBodyOf(refusal.kind)
  }
}

export const answerRefusal = (c: Context, refusal: Refusal): Response => {
  c.set('refusalKind', refusal.kind)
  const { status, body } = refusalBodyOf(refusal)
  return body === undefined ? c.body(null, status) : c.json(body, status)
}
