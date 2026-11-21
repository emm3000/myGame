import { z } from 'zod'

export const StartLessonRequestSchema = z.strictObject({
  lessonId: z.string().min(1),
})

export type StartLessonRequest = z.infer<typeof StartLessonRequestSchema>
