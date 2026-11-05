import { z } from 'zod'
import { BuildingLevelSchema, InstantSchema } from '../Wire'
import { BuildingKindSchema } from './BuildingKind'
import { ResourceAmountsSchema } from './ResourceAmounts'

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
