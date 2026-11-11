import type { ApiError, ApiErrorKind } from '@mygame/contracts'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { isoOf } from './isoOf'
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
  MalformedRequest: { status: 400 },
  StudySlotBusy: { status: 409, kind: 'StudySlotBusy' },
  InvalidHireCount: { status: 400 },
  InvalidHireDuration: internalFailure,
  SignedOut: { status: 401 },
  TokenInvalid: { status: 400, kind: 'TokenInvalid' },
  MailNotSent: { status: 503, kind: 'MailNotSent' },
  InvalidTownAddress: internalFailure,
  BlankTownName: { status: 400, kind: 'BlankTownName' },
  PlayerAlreadyHoldsTown: { status: 409, kind: 'PlayerAlreadyHoldsTown' },
  SiteTaken: { status: 409 },
  InvalidTownStock: internalFailure,
  InvalidTownBuildingLevel: internalFailure,
  UnknownTownBuildingLevel: internalFailure,
  TownNotFound: { status: 404, kind: 'TownNotFound' },
  FractionalResourceAmount: internalFailure,
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
  NegativeResourceAmount: internalFailure,
  InvalidCellsPerRow: internalFailure,
  SlotFinishesBeforeStored: internalFailure,
  SlotStartsAfterFinish: internalFailure,
  AreaNotFound: { status: 404, kind: 'AreaNotFound' },
  InvalidTeam: { status: 400, kind: 'InvalidTeam' },
  TeamAlreadyOut: { status: 409, kind: 'TeamAlreadyOut' },
  JobSiteOutOfBounds: { status: 400, kind: 'JobSiteOutOfBounds' },
  JobToOwnSite: { status: 409, kind: 'JobToOwnSite' },
  SiteHeld: { status: 409, kind: 'SiteHeld' },
  SiteHasNoWaste: { status: 409 },
  JobNotFound: { status: 409, kind: 'JobNotFound' },
  JobAlreadyReturning: { status: 409, kind: 'JobAlreadyReturning' },
  InvalidJobHours: internalFailure,
  InvalidPayPercent: internalFailure,
  InvalidCleanUp: internalFailure,
}

const slotlessBodyOf = (kind: SlotlessRefusalKind): RefusalBody => {
  const answer = answers[kind]
  return answer.kind === undefined
    ? { status: answer.status }
    : { status: answer.status, body: { kind: answer.kind } }
}

const refusalBodyOf = (refusal: Refusal): RefusalBody => {
  switch (refusal.kind) {
    case 'WaitingListFull':
      return { status: 409, body: { kind: refusal.kind, params: { cap: refusal.cap } } }
    case 'NotEnoughPeople': {
      const { kind, requiredPeople, freePeople } = refusal
      return { status: 409, body: { kind, params: { requiredPeople, freePeople } } }
    }
    case 'NotEnoughResources':
      return { status: 409, body: { kind: refusal.kind, params: { missing: refusal.missing } } }
    case 'LearningCapReached': {
      const { kind, learningCap, cardsInLearning } = refusal
      return { status: 409, body: { kind, params: { learningCap, cardsInLearning } } }
    }
    case 'TopLevelReached':
    case 'BuildingWorkNotFound': {
      const { kind, building, level } = refusal
      return { status: 409, body: { kind, params: { building, level } } }
    }
    case 'OfficeTooLow': {
      const { kind, hire, requiredOfficeLevel, officeLevel } = refusal
      return { status: 409, body: { kind, params: { hire, requiredOfficeLevel, officeLevel } } }
    }
    case 'HiringSlotBusy':
      return { status: 409, body: { kind: refusal.kind, params: { hire: refusal.hire } } }
    case 'HiringOrderNotFound': {
      const { kind, hire, startedAt } = refusal
      return { status: 409, body: { kind, params: { hire, startedAt: isoOf(startedAt) } } }
    }
    case 'JobHoursOutOfRange': {
      const { kind, hours, maxHours } = refusal
      return { status: 400, body: { kind, params: { hours, maxHours } } }
    }
    case 'NotEnoughHiresAtHome': {
      const { kind, hire, count, atHome } = refusal
      return { status: 409, body: { kind, params: { hire, count, atHome } } }
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
