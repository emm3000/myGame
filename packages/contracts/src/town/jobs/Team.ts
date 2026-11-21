import { z } from 'zod'
import { WholeCountSchema } from '../../platform/Wire'

export const TeamSchema = z
  .strictObject({
    worker: WholeCountSchema,
    truck: WholeCountSchema,
  })
  .meta({ id: 'Team' })
