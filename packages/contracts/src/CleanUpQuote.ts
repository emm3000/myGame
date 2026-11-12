import { z } from 'zod'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { WholeCountSchema } from './Wire'

export const CleanUpQuoteSchema = z
  .strictObject({
    strength: WholeCountSchema.positive(),
    waste: WholeCountSchema.positive(),
    pay: ResourceAmountsSchema,
    covers: z.boolean(),
  })
  .meta({ id: 'CleanUpQuote' })

export type CleanUpQuote = z.infer<typeof CleanUpQuoteSchema>
