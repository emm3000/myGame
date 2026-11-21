import { z } from 'zod'
import { WholeCountSchema } from '../../platform/Wire'
import { ResourceAmountsSchema } from '../ResourceAmounts'

export const CleanUpQuoteSchema = z
  .strictObject({
    strength: WholeCountSchema.positive(),
    waste: WholeCountSchema.positive(),
    pay: ResourceAmountsSchema,
    covers: z.boolean(),
  })
  .meta({ id: 'CleanUpQuote' })

export type CleanUpQuote = z.infer<typeof CleanUpQuoteSchema>
