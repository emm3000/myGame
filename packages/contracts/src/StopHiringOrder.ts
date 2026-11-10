import { z } from 'zod'
import { HireKindSchema } from './HireKind'
import { InstantSchema } from './Wire'

export const StopHiringOrderSchema = z.object({
  hire: HireKindSchema,
  startedAt: InstantSchema,
})

export type StopHiringOrder = z.infer<typeof StopHiringOrderSchema>
