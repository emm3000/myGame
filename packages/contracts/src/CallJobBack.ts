import { z } from 'zod'
import { InstantSchema } from './Wire'

export const CallJobBackSchema = z.object({
  sentAt: InstantSchema,
})

export type CallJobBack = z.infer<typeof CallJobBackSchema>
