import { z } from 'zod'
import { ResourceKindSchema } from './town/ResourceKind'
import { BuildingLevelSchema, DurationSecondsSchema, WholeCountSchema } from './Wire'

const WordStandingSchema = z.enum(['notStarted', 'recognize', 'recall', 'hold', 'retained'])

const WordReadingSchema = z.strictObject({
  word: z.string().min(1),
  gloss: z.string().min(1),
  frame: z.string().min(1),
})

export const LessonStateSchema = z.strictObject({
  id: z.string().min(1),
  theme: z.string().min(1),
  durationSeconds: DurationSecondsSchema.positive(),
  requiredSchoolLevel: BuildingLevelSchema,
  skill: z.strictObject({
    resource: ResourceKindSchema,
    ratePercent: WholeCountSchema.positive(),
  }),
  isStudied: z.boolean(),
  words: z.array(
    z.strictObject({
      wordId: z.string().min(1),
      standing: WordStandingSchema,
      reading: WordReadingSchema.nullable(),
    }),
  ),
})
