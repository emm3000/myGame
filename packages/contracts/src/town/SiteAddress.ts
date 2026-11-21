import { z } from 'zod'
import { WholeCountSchema } from '../platform/Wire'

export const SiteAddressSchema = z.strictObject({
  region: WholeCountSchema.positive(),
  area: WholeCountSchema.positive(),
  site: WholeCountSchema.positive(),
})
