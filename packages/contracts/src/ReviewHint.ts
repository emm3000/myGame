import { z } from 'zod'
import { WholeCountSchema } from './Wire'

const ReviewHintWordSchema = z
  .strictObject({
    firstLetter: z.string().min(1),
    letterCount: WholeCountSchema.positive(),
  })
  .meta({ id: 'ReviewHintWord' })

export const ReviewHintSchema = z.strictObject({
  words: z.array(ReviewHintWordSchema).min(1),
})

export type ReviewHint = z.infer<typeof ReviewHintSchema>
