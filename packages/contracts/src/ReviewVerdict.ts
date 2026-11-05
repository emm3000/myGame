import { z } from 'zod'
import { EarnedSkillSchema } from './EarnedSkill'
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
  ratePerHourBefore: QuantitySchema.nullable(),
  ratePerHourAfter: QuantitySchema.nullable(),
})

export type RaisedSkill = z.infer<typeof RaisedSkillSchema>

const CorrectVerdictSchema = RatedVerdictSchema.extend({
  kind: z.literal('correct'),
  earnedSkill: RaisedSkillSchema.nullable(),
}).meta({ id: 'CorrectVerdict' })

const WrongVerdictSchema = RatedVerdictSchema.extend({
  kind: z.literal('wrong'),
}).meta({ id: 'WrongVerdict' })

export const ReviewVerdictSchema = z
  .discriminatedUnion('kind', [NearMissVerdictSchema, CorrectVerdictSchema, WrongVerdictSchema])
  .meta({ id: 'ReviewVerdict' })

export type ReviewVerdict = z.infer<typeof ReviewVerdictSchema>
