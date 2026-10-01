import { z } from 'zod'
import { WholeCountSchema } from './Wire'

export const SeasonDurationPercentSchema = z.strictObject({
  build: WholeCountSchema.positive(),
  study: WholeCountSchema.positive(),
  train: WholeCountSchema.positive(),
  road: WholeCountSchema.positive(),
})
