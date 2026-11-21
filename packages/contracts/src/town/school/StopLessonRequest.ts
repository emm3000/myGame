import { z } from 'zod'

export const StopLessonRequestSchema = z.object({
  lessonId: z.string().min(1),
})

export type StopLessonRequest = z.infer<typeof StopLessonRequestSchema>
