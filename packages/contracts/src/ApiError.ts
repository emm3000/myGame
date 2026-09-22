import { z } from 'zod'
import { ApiErrorKindSchema } from './ApiErrorKind'

export const ApiErrorSchema = z.object({
  kind: ApiErrorKindSchema,
  message: z.string().min(1),
})

export type ApiError = z.infer<typeof ApiErrorSchema>
