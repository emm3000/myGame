import { z } from 'zod'
import { DueReviewSchema } from '../learning/DueReview'
import { InstantSchema, WholeCountSchema } from '../platform/Wire'
import { TownNewsItemSchema } from '../town/news/TownNewsItem'

export const ReportSchema = z
  .strictObject({
    dueCount: WholeCountSchema,
    due: z.array(DueReviewSchema),
    readFirst: z.array(z.string().min(1)),
    nextDueAt: InstantSchema.nullable(),
    readAt: InstantSchema,
    news: z.array(TownNewsItemSchema).max(100),
  })
  .meta({ id: 'Report' })

export type Report = z.infer<typeof ReportSchema>
