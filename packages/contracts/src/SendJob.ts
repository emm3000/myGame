import { z } from 'zod'
import { TeamSchema } from './Team'
import { WholeCountSchema } from './Wire'

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
