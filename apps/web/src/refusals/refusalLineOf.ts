import {
  refusalArtMaxLevelReached,
  refusalBarracksNotBuilt,
  refusalBarracksTooLow,
  refusalBlankFiefName,
  refusalBlankTownName,
  refusalBuildingWorkNotFound,
  refusalCargoAboveCarry,
  refusalEmailTaken,
  refusalEmptyCargo,
  refusalFiefCapReached,
  refusalFiefNotFound,
  refusalHintOnRecognition,
  refusalInsufficientResources,
  refusalInvalidCredentials,
  refusalLessonAlreadyStudied,
  refusalLessonLibraryTooLow,
  refusalLessonStudyNotFound,
  refusalLessonUnderStudy,
  refusalLibraryLevelTooLow,
  refusalMailNotSent,
  refusalMalformedEmail,
  refusalMarchAlreadyReturning,
  refusalMarchNotFound,
  refusalMarchSlotBusy,
  refusalMarchTargetOutOfBounds,
  refusalMarchToOwnPlot,
  refusalMaxLevelReached,
  refusalNotEnoughPeasants,
  refusalNotEnoughPeople,
  refusalNotEnoughResources,
  refusalNotEnoughUnitsAtHome,
  refusalPlayerAlreadyHoldsTown,
  refusalPlotHasCamp,
  refusalPlotHasNoCamp,
  refusalPlotHeld,
  refusalPlotReserved,
  refusalProvinceNotFound,
  refusalQueueFull,
  refusalRecruitOrderNotFound,
  refusalRecruitSlotBusy,
  refusalReviewNotDue,
  refusalStayOutOfRange,
  refusalStudyNotFound,
  refusalStudySlotBusy,
  refusalTokenInvalid,
  refusalTopLevelReached,
  refusalTownNotFound,
  refusalUnexpected,
  refusalUnitUnfitForOrder,
  refusalUnknownBuilding,
  refusalUnknownChoice,
  refusalUnknownWord,
  refusalUpgradeNotFound,
  refusalWaitingListFull,
  refusalWeakPassword,
  refusalWordNotHeld,
} from '@mygame/catalog'
import type { ApiError } from '@mygame/contracts'
import type { ApiRefusal } from '../api/apiClient'
import { formatQuantity } from '../design-system/formatQuantity'
import { countedUnitsOf } from '../units/countedUnitsOf'
import { unitLabelsOf } from '../units/unitLabelsOf'

type RefusalWithParams = Extract<ApiError, { readonly params: unknown }>

type SlotFreeRefusal = Exclude<ApiRefusal, RefusalWithParams['kind']>

const slotFreeLines: Readonly<Record<SlotFreeRefusal, () => string>> = {
  InvalidCredentials: refusalInvalidCredentials,
  EmailTaken: refusalEmailTaken,
  WeakPassword: refusalWeakPassword,
  MalformedEmail: refusalMalformedEmail,
  FiefNotFound: refusalFiefNotFound,
  UnknownBuilding: refusalUnknownBuilding,
  MaxLevelReached: refusalMaxLevelReached,
  QueueFull: refusalQueueFull,
  UpgradeNotFound: refusalUpgradeNotFound,
  InsufficientResources: refusalInsufficientResources,
  NotEnoughPeasants: refusalNotEnoughPeasants,
  BlankFiefName: refusalBlankFiefName,
  StudySlotBusy: refusalStudySlotBusy,
  LibraryLevelTooLow: refusalLibraryLevelTooLow,
  ArtMaxLevelReached: refusalArtMaxLevelReached,
  StudyNotFound: refusalStudyNotFound,
  BarracksNotBuilt: refusalBarracksNotBuilt,
  RecruitSlotBusy: refusalRecruitSlotBusy,
  RecruitOrderNotFound: refusalRecruitOrderNotFound,
  PlotHeld: refusalPlotHeld,
  PlotHasCamp: refusalPlotHasCamp,
  PlotHasNoCamp: refusalPlotHasNoCamp,
  MarchToOwnPlot: refusalMarchToOwnPlot,
  MarchSlotBusy: refusalMarchSlotBusy,
  MarchTargetOutOfBounds: refusalMarchTargetOutOfBounds,
  MarchNotFound: refusalMarchNotFound,
  MarchAlreadyReturning: refusalMarchAlreadyReturning,
  UnitUnfitForOrder: refusalUnitUnfitForOrder,
  PlotReserved: refusalPlotReserved,
  EmptyCargo: refusalEmptyCargo,
  ProvinceNotFound: refusalProvinceNotFound,
  TokenInvalid: refusalTokenInvalid,
  MailNotSent: refusalMailNotSent,
  LessonLibraryTooLow: refusalLessonLibraryTooLow,
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

const hasParams = (error: ApiError): error is RefusalWithParams => 'params' in error

const isSlotFree = (refusal: ApiRefusal): refusal is SlotFreeRefusal =>
  Object.hasOwn(slotFreeLines, refusal)

const lineWithParamsOf = (error: RefusalWithParams): string => {
  switch (error.kind) {
    case 'NotEnoughUnitsAtHome':
      return refusalNotEnoughUnitsAtHome({
        units: countedUnitsOf(error.params.unit, error.params.count),
        atHome: error.params.atHome,
      })
    case 'BarracksTooLow':
      return refusalBarracksTooLow({
        requiredBarracksLevel: error.params.requiredBarracksLevel,
        plural: unitLabelsOf(error.params.unit).plural,
      })
    case 'FiefCapReached':
      return refusalFiefCapReached(error.params)
    case 'CargoAboveCarry':
      return refusalCargoAboveCarry({
        cargo: formatQuantity(error.params.cargo),
        carry: formatQuantity(error.params.carry),
      })
    case 'StayOutOfRange':
      return refusalStayOutOfRange(error.params)
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
  }
}

export function refusalLineOf(refusal: ApiRefusal, error?: ApiError): string {
  if (error !== undefined && hasParams(error)) {
    return lineWithParamsOf(error)
  }
  return isSlotFree(refusal) ? slotFreeLines[refusal]() : refusalUnexpected()
}
