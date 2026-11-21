import { z } from 'zod'
import { WholeCountSchema } from '../../platform/Wire'
import { TeamSchema } from './Team'

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
