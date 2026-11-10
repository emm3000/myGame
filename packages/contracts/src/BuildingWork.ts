import { z } from 'zod'
import { BuildingKindSchema } from './BuildingKind'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { BuildingLevelSchema, InstantSchema } from './Wire'

export const BuildingWorkSchema = z
  .strictObject({
    building: BuildingKindSchema,
    level: BuildingLevelSchema,
    cost: ResourceAmountsSchema,
    startsAt: InstantSchema,
    finishesAt: InstantSchema,
  })
  .meta({ id: 'BuildingWork' })

export type BuildingWork = z.infer<typeof BuildingWorkSchema>
