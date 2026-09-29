import { z } from 'zod'
import { UnitKindSchema } from './UnitKind'
import { WholeCountSchema } from './Wire'

export const PlaceRecruitOrderRequestSchema = z.object({
  unit: UnitKindSchema,
  count: WholeCountSchema.positive(),
})

export type PlaceRecruitOrderRequest = z.infer<typeof PlaceRecruitOrderRequestSchema>
