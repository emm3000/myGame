import { z } from 'zod'
import { WholeCountSchema } from './Wire'

export const SiteAddressSchema = z.strictObject({
  region: WholeCountSchema.positive(),
  area: WholeCountSchema.positive(),
  site: WholeCountSchema.positive(),
})
