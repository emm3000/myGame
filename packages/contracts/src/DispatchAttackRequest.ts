import { z } from 'zod'
import { PartySchema } from './Party'
import { WholeCountSchema } from './Wire'

export const DispatchAttackRequestSchema = z.object({
  province: WholeCountSchema.positive(),
  plot: WholeCountSchema.positive(),
  units: PartySchema,
})

export type DispatchAttackRequest = z.infer<typeof DispatchAttackRequestSchema>
