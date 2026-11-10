import {
  refusalBlankTownName,
  refusalBuildingWorkNotFound,
  refusalEmailTaken,
  refusalHintOnRecognition,
  refusalInvalidCredentials,
  refusalLearningCapReached,
  refusalLessonAlreadyStudied,
  refusalLessonSchoolTooLow,
  refusalLessonStudyNotFound,
  refusalLessonUnderStudy,
  refusalMailNotSent,
  refusalMalformedEmail,
  refusalNotEnoughPeople,
  refusalNotEnoughResources,
  refusalPlayerAlreadyHoldsTown,
  refusalReviewNotDue,
  refusalStudySlotBusy,
  refusalTokenInvalid,
  refusalTopLevelReached,
  refusalTownNotFound,
  refusalUnexpected,
  refusalUnknownChoice,
  refusalUnknownWord,
  refusalWaitingListFull,
  refusalWeakPassword,
  refusalWordNotHeld,
} from '@mygame/catalog'
import type { ApiError } from '@mygame/contracts'
import type { ApiRefusal } from '../api/apiClient'

type RefusalWithParams = Extract<ApiError, { readonly params: unknown }>

type SlotFreeRefusal = Exclude<ApiRefusal, RefusalWithParams['kind']>

const slotFreeLines: Readonly<Record<SlotFreeRefusal, () => string>> = {
  InvalidCredentials: refusalInvalidCredentials,
  EmailTaken: refusalEmailTaken,
  WeakPassword: refusalWeakPassword,
  MalformedEmail: refusalMalformedEmail,
  StudySlotBusy: refusalStudySlotBusy,
  TokenInvalid: refusalTokenInvalid,
  MailNotSent: refusalMailNotSent,
  LessonSchoolTooLow: refusalLessonSchoolTooLow,
  LessonAlreadyStudied: refusalLessonAlreadyStudied,
  LessonUnderStudy: refusalLessonUnderStudy,
  LessonStudyNotFound: refusalLessonStudyNotFound,
  ReviewNotDue: refusalReviewNotDue,
  HintOnRecognition: refusalHintOnRecognition,
  UnknownChoice: refusalUnknownChoice,
  WordNotHeld: refusalWordNotHeld,
  UnknownWord: refusalUnknownWord,
  TownNotFound: refusalTownNotFound,
  PlayerAlreadyHoldsTown: refusalPlayerAlreadyHoldsTown,
  BlankTownName: refusalBlankTownName,
  Unexpected: refusalUnexpected,
}

const isSlotFree = (refusal: ApiRefusal): refusal is SlotFreeRefusal =>
  Object.hasOwn(slotFreeLines, refusal)

const hasParams = (error: ApiError): error is RefusalWithParams => 'params' in error

const lineWithParamsOf = (error: RefusalWithParams): string => {
  switch (error.kind) {
    case 'WaitingListFull':
      return refusalWaitingListFull(error.params)
    case 'NotEnoughPeople':
      return refusalNotEnoughPeople(error.params)
    case 'NotEnoughResources':
      return refusalNotEnoughResources()
    case 'TopLevelReached':
      return refusalTopLevelReached({ level: error.params.level })
    case 'BuildingWorkNotFound':
      return refusalBuildingWorkNotFound({ level: error.params.level })
    case 'LearningCapReached':
      return refusalLearningCapReached(error.params)
    default: {
      const unhandled: never = error
      return unhandled
    }
  }
}

export function refusalLineOf(refusal: ApiRefusal, error?: ApiError): string {
  if (error !== undefined && hasParams(error)) {
    return lineWithParamsOf(error)
  }
  return isSlotFree(refusal) ? slotFreeLines[refusal]() : refusalUnexpected()
}
