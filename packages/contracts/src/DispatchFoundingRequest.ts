import { z } from 'zod'
import { WholeCountSchema } from './Wire'

export const DispatchFoundingRequestSchema = z.strictObject({
  province: WholeCountSchema.positive(),
  plot: WholeCountSchema.positive(),
  name: z.string().min(1),
})

export type DispatchFoundingRequest = z.infer<typeof DispatchFoundingRequestSchema>
