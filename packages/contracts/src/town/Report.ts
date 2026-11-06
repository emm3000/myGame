import { z } from 'zod'
import { DueReviewSchema } from '../DueReview'
import { InstantSchema, WholeCountSchema } from '../Wire'
import { TownNewsItemSchema } from './TownNewsItem'

export const ReportSchema = z
  .strictObject({
    dueCount: WholeCountSchema,
    due: z.array(DueReviewSchema),
    readFirst: z.array(z.string().min(1)),
    nextDueAt: InstantSchema.nullable(),
    news: z.array(TownNewsItemSchema).max(100),
  })
  .meta({ id: 'Report' })

export type Report = z.infer<typeof ReportSchema>
