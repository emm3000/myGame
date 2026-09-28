import { z } from 'zod'
import { ArtKindSchema } from './ArtKind'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { ResourceKindSchema } from './ResourceKind'
import { BuildingLevelSchema, DurationSecondsSchema, QuantitySchema } from './Wire'

const ArtLevelSchema = z.object({
  level: z.number().int().positive(),
  cost: ResourceAmountsSchema,
  durationSeconds: DurationSecondsSchema,
  requiredLibraryLevel: BuildingLevelSchema,
  effect: z.object({ ratePercent: QuantitySchema }),
})

export const ArtContentSchema = z.object({
  art: ArtKindSchema,
  resource: ResourceKindSchema,
  levels: z.array(ArtLevelSchema).min(1),
})

export type ArtContent = z.infer<typeof ArtContentSchema>
