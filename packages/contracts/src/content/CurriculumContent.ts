import { z } from 'zod'
import { WholeCountSchema } from '../platform/Wire'
import { ResourceKindSchema } from '../town/ResourceKind'

export const CurriculumContentSchema = z.strictObject({
  chromeLessonCount: WholeCountSchema,
  lessonIds: z.array(z.string().min(1)).min(1),
  skill: z.strictObject({
    resource: ResourceKindSchema,
    ratePercent: WholeCountSchema.positive(),
  }),
})

export type CurriculumContent = z.infer<typeof CurriculumContentSchema>
