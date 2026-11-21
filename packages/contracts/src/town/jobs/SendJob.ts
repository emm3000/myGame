import { z } from 'zod'
import { WholeCountSchema } from '../../platform/Wire'
import { TeamSchema } from './Team'

export const SendJobSchema = z
  .strictObject({
    site: z.strictObject({
      area: WholeCountSchema.positive(),
      site: WholeCountSchema.positive(),
    }),
    team: TeamSchema,
    hours: WholeCountSchema.positive(),
  })
  .meta({ id: 'SendJob' })

export type SendJob = z.infer<typeof SendJobSchema>
