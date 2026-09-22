import { z } from 'zod'
import { WholeCountSchema } from './Wire'

export const ResourceAmountsSchema = z.object({
  wood: WholeCountSchema,
  stone: WholeCountSchema,
  iron: WholeCountSchema,
  gold: WholeCountSchema,
  food: WholeCountSchema,
})

export type ResourceAmounts = z.infer<typeof ResourceAmountsSchema>
