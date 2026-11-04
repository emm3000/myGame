import { z } from 'zod'
import { ResourceKindSchema } from './ResourceKind'
import { InstantSchema, WholeCountSchema } from './Wire'

export const EarnedSkillSchema = z.strictObject({
  lessonId: z.string().min(1),
  resource: ResourceKindSchema,
  ratePercent: WholeCountSchema.positive(),
  earnedAt: InstantSchema,
})
