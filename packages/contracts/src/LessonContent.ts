import { z } from 'zod'
import { BuildingLevelSchema, DurationSecondsSchema } from './Wire'

export const LessonContentSchema = z.strictObject({
  id: z.string().min(1),
  theme: z.string().min(1),
  durationSeconds: DurationSecondsSchema.positive(),
  requiredSchoolLevel: BuildingLevelSchema,
  wordIds: z.array(z.string().min(1)).min(1),
})

export type LessonContent = z.infer<typeof LessonContentSchema>
