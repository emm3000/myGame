import { z } from 'zod'
import { WholeCountSchema } from './Wire'

export const ReviewHintSchema = z.strictObject({
  firstLetter: z.string().min(1),
  letterCount: WholeCountSchema.positive(),
})

export type ReviewHint = z.infer<typeof ReviewHintSchema>
