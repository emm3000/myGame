import { z } from 'zod'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { SiteAddressSchema } from './SiteAddress'
import { TeamSchema } from './Team'
import { WasteSizeSchema } from './WasteSize'
import { InstantSchema, WholeCountSchema } from './Wire'

const JobPhaseSchema = z.enum(['outbound', 'working', 'returning']).meta({ id: 'JobPhase' })

const outFields = {
  site: SiteAddressSchema,
  team: TeamSchema,
  pay: ResourceAmountsSchema,
  phase: JobPhaseSchema,
  sentAt: InstantSchema,
  arrivesAt: InstantSchema,
  leavesAt: InstantSchema,
  returnsAt: InstantSchema,
  calledBackAt: InstantSchema.nullable(),
}

const JobSchema = z
  .strictObject({
    kind: z.literal('job'),
    ...outFields,
    hours: WholeCountSchema.positive(),
  })
  .meta({ id: 'Job' })

const CleanUpJobSchema = z
  .strictObject({
    kind: z.literal('cleanUp'),
    ...outFields,
    size: WasteSizeSchema,
    waste: WholeCountSchema,
  })
  .meta({ id: 'CleanUpJob' })

export const TownJobSchema = z
  .discriminatedUnion('kind', [JobSchema, CleanUpJobSchema])
  .meta({ id: 'TownJob' })
