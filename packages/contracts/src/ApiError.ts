import { z } from 'zod'

export const ApiErrorKindSchema = z.enum([
  'InvalidCredentials',
  'EmailTaken',
  'WeakPassword',
  'FiefNotFound',
  'UnknownBuilding',
  'MaxLevelReached',
  'SlotBusy',
  'InsufficientResources',
  'NotEnoughPeasants',
])

export const ApiErrorSchema = z.object({
  kind: ApiErrorKindSchema,
  message: z.string().min(1),
})

export type ApiErrorKind = z.infer<typeof ApiErrorKindSchema>

export type ApiError = z.infer<typeof ApiErrorSchema>
