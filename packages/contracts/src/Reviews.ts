import { z } from 'zod'
import { DueReviewSchema } from './DueReview'
import { InstantSchema } from './Wire'

export const ReviewsSchema = z
  .strictObject({
    due: z.array(DueReviewSchema),
    nextDueAt: InstantSchema.nullable(),
    readAt: InstantSchema,
  })
  .meta({ id: 'Reviews' })

export type Reviews = z.infer<typeof ReviewsSchema>
