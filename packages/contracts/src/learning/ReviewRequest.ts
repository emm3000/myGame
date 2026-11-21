import { z } from 'zod'

export const ReviewRequestSchema = z.object({
  wordId: z.string().min(1),
})

export type ReviewRequest = z.infer<typeof ReviewRequestSchema>
