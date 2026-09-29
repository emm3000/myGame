import { z } from 'zod'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { ResourceKindSchema } from './ResourceKind'
import { SeasonDurationPercentSchema } from './SeasonDurationPercent'
import { SeasonKindSchema } from './SeasonKind'
import { TerrainSchema } from './Terrain'
import { UnitKindSchema } from './UnitKind'
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
  durationPercent: z.record(SeasonKindSchema, SeasonDurationPercentSchema),
})

const UnitTermsSchema = z.strictObject({
  cost: ResourceAmountsSchema,
  durationSeconds: WholeCountSchema.positive(),
  peasantOccupancy: WholeCountSchema.positive(),
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
  units: z.record(UnitKindSchema, UnitTermsSchema),
})

export type FiefContent = z.infer<typeof FiefContentSchema>
