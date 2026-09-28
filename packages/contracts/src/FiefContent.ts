import { z } from 'zod'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { ResourceKindSchema } from './ResourceKind'
import { SeasonKindSchema } from './SeasonKind'
import { TerrainSchema } from './Terrain'
import { InstantSchema, QuantitySchema, WholeCountSchema } from './Wire'

const TerrainBonusSchema = z.object({
  resource: ResourceKindSchema,
  ratePerHour: QuantitySchema,
})

const SeasonCalendarSchema = z.strictObject({
  epoch: InstantSchema,
  daysPerSeason: WholeCountSchema.positive(),
  multiplierPercent: z.record(
    SeasonKindSchema,
    z.record(ResourceKindSchema, WholeCountSchema.positive()),
  ),
})

export const FiefContentSchema = z.object({
  startingStocks: ResourceAmountsSchema,
  startingCapacity: WholeCountSchema,
  basePeasantSupply: WholeCountSchema,
  plotsPerProvince: WholeCountSchema.positive(),
  baseRates: ResourceAmountsSchema,
  terrainBonus: z.record(TerrainSchema, TerrainBonusSchema),
  buildQueueCap: WholeCountSchema,
  seasons: SeasonCalendarSchema,
})

export type FiefContent = z.infer<typeof FiefContentSchema>
