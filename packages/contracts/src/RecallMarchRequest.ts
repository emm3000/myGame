import { z } from 'zod'
import { InstantSchema } from './Wire'

export const RecallMarchRequestSchema = z.object({
  departedAt: InstantSchema,
})

export type RecallMarchRequest = z.infer<typeof RecallMarchRequestSchema>
