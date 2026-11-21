import { z } from 'zod'
import { BuildingKindSchema } from './BuildingKind'

export const StopBuildingWorkSchema = z.object({
  building: BuildingKindSchema,
  level: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number),
})

export type StopBuildingWork = z.infer<typeof StopBuildingWorkSchema>
