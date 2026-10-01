import { z } from 'zod'
import { PartySchema } from './Party'
import { WholeCountSchema } from './Wire'

export const DispatchMarchRequestSchema = z.object({
  province: WholeCountSchema.positive(),
  plot: WholeCountSchema.positive(),
  units: PartySchema,
  stayHours: WholeCountSchema.positive(),
})

export type DispatchMarchRequest = z.infer<typeof DispatchMarchRequestSchema>
