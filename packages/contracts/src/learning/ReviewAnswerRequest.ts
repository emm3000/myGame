import { z } from 'zod'

export const ReviewAnswerRequestSchema = z.strictObject({
  answer: z.string().max(100),
})

export type ReviewAnswerRequest = z.infer<typeof ReviewAnswerRequestSchema>
