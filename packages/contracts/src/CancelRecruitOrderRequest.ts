import { z } from 'zod'
import { UnitKindSchema } from './UnitKind'
import { InstantSchema } from './Wire'

export const CancelRecruitOrderRequestSchema = z.object({
  unit: UnitKindSchema,
  startedAt: InstantSchema,
})

export type CancelRecruitOrderRequest = z.infer<typeof CancelRecruitOrderRequestSchema>
