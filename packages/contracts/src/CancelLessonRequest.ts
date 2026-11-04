import { z } from 'zod'

export const CancelLessonRequestSchema = z.object({
  lessonId: z.string().min(1),
})

export type CancelLessonRequest = z.infer<typeof CancelLessonRequestSchema>
