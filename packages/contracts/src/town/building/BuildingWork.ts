import { z } from 'zod'
import { BuildingLevelSchema, InstantSchema } from '../../platform/Wire'
import { ResourceAmountsSchema } from '../ResourceAmounts'
import { BuildingKindSchema } from './BuildingKind'

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
