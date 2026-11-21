import type { ApiError } from '@mygame/contracts'
import type { ApiRefusal } from '../api/apiClient'
import type { FixedCopyCatalog } from '../copy/PlayerCopy'

type RefusalWithParams = Extract<ApiError, { readonly params: unknown }>

type SlotFreeRefusal = Exclude<ApiRefusal, RefusalWithParams['kind']>

const slotFreeLines: Readonly<Record<SlotFreeRefusal, (catalog: FixedCopyCatalog) => string>> = {
  InvalidCredentials: (catalog) => catalog.refusalInvalidCredentials(),
  EmailTaken: (catalog) => catalog.refusalEmailTaken(),
  WeakPassword: (catalog) => catalog.refusalWeakPassword(),
  MalformedEmail: (catalog) => catalog.refusalMalformedEmail(),
  StudySlotBusy: (catalog) => catalog.refusalStudySlotBusy(),
  TokenInvalid: (catalog) => catalog.refusalTokenInvalid(),
  MailNotSent: (catalog) => catalog.refusalMailNotSent(),
  LessonSchoolTooLow: (catalog) => catalog.refusalLessonSchoolTooLow(),
  LessonAlreadyStudied: (catalog) => catalog.refusalLessonAlreadyStudied(),
  LessonUnderStudy: (catalog) => catalog.refusalLessonUnderStudy(),
  LessonStudyNotFound: (catalog) => catalog.refusalLessonStudyNotFound(),
  ReviewNotDue: (catalog) => catalog.refusalReviewNotDue(),
  HintOnRecognition: (catalog) => catalog.refusalHintOnRecognition(),
  UnknownChoice: (catalog) => catalog.refusalUnknownChoice(),
  WordNotHeld: (catalog) => catalog.refusalWordNotHeld(),
  UnknownWord: (catalog) => catalog.refusalUnknownWord(),
  TownNotFound: (catalog) => catalog.refusalTownNotFound(),
  PlayerAlreadyHoldsTown: (catalog) => catalog.refusalPlayerAlreadyHoldsTown(),
  BlankTownName: (catalog) => catalog.refusalBlankTownName(),
  AreaNotFound: (catalog) => catalog.refusalAreaNotFound(),
  InvalidTeam: (catalog) => catalog.refusalInvalidTeam(),
  JobSiteOutOfBounds: (catalog) => catalog.refusalJobSiteOutOfBounds(),
  TeamAlreadyOut: (catalog) => catalog.refusalTeamAlreadyOut(),
  JobToOwnSite: (catalog) => catalog.refusalJobToOwnSite(),
  SiteHeld: (catalog) => catalog.refusalSiteHeld(),
  JobNotFound: (catalog) => catalog.refusalJobNotFound(),
  JobAlreadyReturning: (catalog) => catalog.refusalJobAlreadyReturning(),
  NotAWasteSite: (catalog) => catalog.refusalNotAWasteSite(),
  NoWasteYet: (catalog) => catalog.refusalNoWasteYet(),
  Unexpected: (catalog) => catalog.refusalUnexpected(),
}

const isSlotFree = (refusal: ApiRefusal): refusal is SlotFreeRefusal =>
  Object.hasOwn(slotFreeLines, refusal)

const hasParams = (error: ApiError): error is RefusalWithParams => 'params' in error

const lineWithParamsOf = (catalog: FixedCopyCatalog, error: RefusalWithParams): string => {
  switch (error.kind) {
    case 'WaitingListFull':
      return catalog.refusalWaitingListFull(error.params)
    case 'NotEnoughPeople':
      return catalog.refusalNotEnoughPeople(error.params)
    case 'NotEnoughWords':
      return catalog.refusalNotEnoughWords(error.params)
    case 'NotEnoughResources':
      return catalog.refusalNotEnoughResources()
    case 'TopLevelReached':
      return catalog.refusalTopLevelReached({ level: error.params.level })
    case 'BuildingWorkNotFound':
      return catalog.refusalBuildingWorkNotFound({ level: error.params.level })
    case 'LearningCapReached':
      return catalog.refusalLearningCapReached(error.params)
    case 'OfficeTooLow':
      return catalog.refusalOfficeTooLow(error.params)
    case 'HiringSlotBusy':
      return catalog.refusalHiringSlotBusy()
    case 'HiringOrderNotFound':
      return catalog.refusalHiringOrderNotFound()
    case 'JobHoursOutOfRange':
      return catalog.refusalJobHoursOutOfRange({ maxHours: error.params.maxHours })
    case 'NotEnoughHiresAtHome':
      return catalog.refusalNotEnoughHiresAtHome(error.params)
    default: {
      const unhandled: never = error
      return unhandled
    }
  }
}

export function refusalLineOf(
  catalog: FixedCopyCatalog,
  refusal: ApiRefusal,
  error?: ApiError,
): string {
  if (error !== undefined && hasParams(error)) {
    return lineWithParamsOf(catalog, error)
  }
  return isSlotFree(refusal) ? slotFreeLines[refusal](catalog) : catalog.refusalUnexpected()
}
