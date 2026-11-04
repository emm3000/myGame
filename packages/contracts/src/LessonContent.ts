import { z } from 'zod'
import { ResourceKindSchema } from './ResourceKind'
import { BuildingLevelSchema, DurationSecondsSchema, WholeCountSchema } from './Wire'

const LessonWordContentSchema = z.strictObject({
  id: z.string().min(1),
  lemma: z.string().min(1),
  frame: z.string().min(1),
  gappedFrame: z.string().min(1),
  gloss: z.strictObject({ es: z.string().min(1) }),
})

export const LessonContentSchema = z.strictObject({
  id: z.string().min(1),
  theme: z.string().min(1),
  durationSeconds: DurationSecondsSchema.positive(),
  requiredLibraryLevel: BuildingLevelSchema,
  skill: z.strictObject({
    resource: ResourceKindSchema,
    ratePercent: WholeCountSchema.positive(),
  }),
  words: z.array(LessonWordContentSchema).min(1),
})

export type LessonContent = z.infer<typeof LessonContentSchema>
