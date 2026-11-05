import { z } from 'zod'
import { ResourceKindSchema } from './town/ResourceKind'
import { WholeCountSchema } from './Wire'

export const CurriculumContentSchema = z.strictObject({
  chromeLessonCount: WholeCountSchema,
  lessonIds: z.array(z.string().min(1)).min(1),
  skill: z.strictObject({
    cycle: z.array(ResourceKindSchema).min(1),
    ratePercent: WholeCountSchema.positive(),
  }),
})

export type CurriculumContent = z.infer<typeof CurriculumContentSchema>
