import { z } from 'zod'
import { ResourceAmountsSchema } from './ResourceAmounts'

export const JobQuoteSchema = z
  .strictObject({
    pay: ResourceAmountsSchema,
  })
  .meta({ id: 'JobQuote' })

export type JobQuote = z.infer<typeof JobQuoteSchema>
