import { z } from 'zod'
import { InstantSchema } from '../../platform/Wire'
import { HireKindSchema } from './HireKind'

export const StopHiringOrderSchema = z.object({
  hire: HireKindSchema,
  startedAt: InstantSchema,
})

export type StopHiringOrder = z.infer<typeof StopHiringOrderSchema>
