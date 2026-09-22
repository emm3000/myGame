import { z } from 'zod'
import { BuildingKindSchema } from './BuildingKind'

export const EnqueueBuildingRequestSchema = z.object({
  building: BuildingKindSchema,
})

export type EnqueueBuildingRequest = z.infer<typeof EnqueueBuildingRequestSchema>
