import { z } from 'zod'
import { WholeCountSchema } from '../Wire'

export const ResourceAmountsSchema = z.strictObject({
  money: WholeCountSchema,
  food: WholeCountSchema,
  power: WholeCountSchema,
  material: WholeCountSchema,
})

export type ResourceAmounts = z.infer<typeof ResourceAmountsSchema>
