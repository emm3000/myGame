import { z } from 'zod'
import { WholeCountSchema } from './Wire'

export const DispatchMarchRequestSchema = z.object({
  province: WholeCountSchema.positive(),
  plot: WholeCountSchema.positive(),
  infantry: WholeCountSchema.positive(),
  stayHours: WholeCountSchema.positive(),
})

export type DispatchMarchRequest = z.infer<typeof DispatchMarchRequestSchema>
