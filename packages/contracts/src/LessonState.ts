import { z } from 'zod'
import { ResourceKindSchema } from './town/ResourceKind'
import { BuildingLevelSchema, DurationSecondsSchema, WholeCountSchema } from './Wire'

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
      isRetained: z.boolean(),
    }),
  ),
})
