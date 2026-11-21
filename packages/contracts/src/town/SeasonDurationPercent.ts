import { z } from 'zod'
import { WholeCountSchema } from '../platform/Wire'

export const SeasonDurationPercentSchema = z.strictObject({
  build: WholeCountSchema.positive(),
  study: WholeCountSchema.positive(),
  hire: WholeCountSchema.positive(),
  road: WholeCountSchema.positive(),
})
