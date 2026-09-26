import { z } from 'zod'
import { BuildingKindSchema } from './BuildingKind'

export const CancelUpgradeRequestSchema = z.object({
  building: BuildingKindSchema,
  targetLevel: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number),
})

export type CancelUpgradeRequest = z.infer<typeof CancelUpgradeRequestSchema>
