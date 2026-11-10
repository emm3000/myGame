import { z } from 'zod'
import { BuildingKindSchema } from './BuildingKind'

export const StartBuildingWorkSchema = z
  .strictObject({ building: BuildingKindSchema })
  .meta({ id: 'StartBuildingWork' })

export type StartBuildingWork = z.infer<typeof StartBuildingWorkSchema>
