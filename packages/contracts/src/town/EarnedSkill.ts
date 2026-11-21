import { z } from 'zod'
import { InstantSchema, WholeCountSchema } from '../platform/Wire'
import { ResourceKindSchema } from './ResourceKind'

export const EarnedSkillSchema = z.strictObject({
  lessonId: z.string().min(1),
  resource: ResourceKindSchema,
  ratePercent: WholeCountSchema.positive(),
  earnedAt: InstantSchema,
})
