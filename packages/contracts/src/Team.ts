import { z } from 'zod'
import { WholeCountSchema } from './Wire'

export const TeamSchema = z.strictObject({
  worker: WholeCountSchema,
  truck: WholeCountSchema,
})
