import { z } from 'zod'
import { ReviewVerdictSchema } from './ReviewVerdict'

export const ReviewAnswerSchema = z
  .strictObject({
    verdict: ReviewVerdictSchema,
  })
  .meta({ id: 'ReviewAnswer' })

export type ReviewAnswer = z.infer<typeof ReviewAnswerSchema>
