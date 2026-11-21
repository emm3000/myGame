import { z } from 'zod'
import { InstantSchema } from '../platform/Wire'
import { DueReviewSchema } from './DueReview'

export const ReviewsSchema = z
  .strictObject({
    due: z.array(DueReviewSchema),
    readFirst: z.array(z.string().min(1)),
    nextDueAt: InstantSchema.nullable(),
    readAt: InstantSchema,
  })
  .meta({ id: 'Reviews' })

export type Reviews = z.infer<typeof ReviewsSchema>
