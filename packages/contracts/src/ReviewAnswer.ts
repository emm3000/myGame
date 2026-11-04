import { z } from 'zod'
import { EarnedSkillSchema } from './EarnedSkill'
import { FiefOverviewSchema } from './FiefOverview'
import { InstantSchema, QuantitySchema, WholeCountSchema } from './Wire'

const NearMissVerdictSchema = z
  .strictObject({
    kind: z.literal('nearMiss'),
  })
  .meta({ id: 'NearMissVerdict' })

const RatedVerdictSchema = z.strictObject({
  word: z.string().min(1),
  gloss: z.string().min(1),
  dueAt: InstantSchema,
})

const RaisedSkillSchema = EarnedSkillSchema.extend({
  level: WholeCountSchema.positive(),
  ratePerHourBefore: QuantitySchema,
  ratePerHourAfter: QuantitySchema,
})

const CorrectVerdictSchema = RatedVerdictSchema.extend({
  kind: z.literal('correct'),
  earnedSkill: RaisedSkillSchema.nullable(),
}).meta({ id: 'CorrectVerdict' })

const WrongVerdictSchema = RatedVerdictSchema.extend({
  kind: z.literal('wrong'),
}).meta({ id: 'WrongVerdict' })

const ReviewVerdictSchema = z
  .discriminatedUnion('kind', [NearMissVerdictSchema, CorrectVerdictSchema, WrongVerdictSchema])
  .meta({ id: 'ReviewVerdict' })

export const ReviewAnswerSchema = z.strictObject({
  verdict: ReviewVerdictSchema,
  fief: FiefOverviewSchema,
})

export type ReviewAnswer = z.infer<typeof ReviewAnswerSchema>
