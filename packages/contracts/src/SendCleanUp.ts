import { z } from 'zod'
import { TeamSchema } from './Team'
import { WholeCountSchema } from './Wire'

export const SendCleanUpSchema = z
  .strictObject({
    site: z.strictObject({
      area: WholeCountSchema.positive(),
      site: WholeCountSchema.positive(),
    }),
    team: TeamSchema,
  })
  .meta({ id: 'SendCleanUp' })

export type SendCleanUp = z.infer<typeof SendCleanUpSchema>
