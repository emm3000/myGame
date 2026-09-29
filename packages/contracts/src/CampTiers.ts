import { z } from 'zod'
import { WholeCountSchema } from './Wire'

const CampTierTermsSchema = z.strictObject({
  maxStrength: WholeCountSchema.positive(),
  regrowHours: WholeCountSchema.positive(),
})

export const CampTiersSchema = z.strictObject({
  1: CampTierTermsSchema,
  2: CampTierTermsSchema,
  3: CampTierTermsSchema,
})
