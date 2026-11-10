import { z } from 'zod'

export const ApiErrorKindSchema = z.enum([
  'InvalidCredentials',
  'EmailTaken',
  'WeakPassword',
  'MalformedEmail',
  'StudySlotBusy',
  'TokenInvalid',
  'MailNotSent',
  'LessonSchoolTooLow',
  'LearningCapReached',
  'LessonAlreadyStudied',
  'LessonUnderStudy',
  'LessonStudyNotFound',
  'ReviewNotDue',
  'HintOnRecognition',
  'UnknownChoice',
  'WordNotHeld',
  'UnknownWord',
  'TownNotFound',
  'PlayerAlreadyHoldsTown',
  'BlankTownName',
  'WaitingListFull',
  'NotEnoughPeople',
  'NotEnoughResources',
  'TopLevelReached',
  'BuildingWorkNotFound',
])

export type ApiErrorKind = z.infer<typeof ApiErrorKindSchema>
