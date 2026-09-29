import { z } from 'zod'
import { WholeCountSchema } from './Wire'

export const DispatchAttackRequestSchema = z.object({
  province: WholeCountSchema.positive(),
  plot: WholeCountSchema.positive(),
  infantry: WholeCountSchema.positive(),
})

export type DispatchAttackRequest = z.infer<typeof DispatchAttackRequestSchema>
