import { z } from 'zod'

export const ApiErrorKindSchema = z.enum([
  'InvalidCredentials',
  'EmailTaken',
  'WeakPassword',
  'FiefNotFound',
  'UnknownBuilding',
  'MaxLevelReached',
  'SlotBusy',
  'SlotIdle',
  'InsufficientResources',
  'NotEnoughPeasants',
  'BlankFiefName',
])

export type ApiErrorKind = z.infer<typeof ApiErrorKindSchema>
