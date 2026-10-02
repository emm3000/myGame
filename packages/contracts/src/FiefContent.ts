import { z } from 'zod'
import { CampTiersSchema } from './CampTiers'
import { ForageTermsSchema } from './ForageTerms'
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
  strength: WholeCountSchema,
  carry: WholeCountSchema,
  roadPercent: WholeCountSchema.positive(),
  barracksLevel: WholeCountSchema.positive(),
})

const CampTermsSchema = z.strictObject({
  campFraction: z.number().min(0).max(1),
  lootPerStrength: WholeCountSchema.positive(),
  tiers: CampTiersSchema,
})

export const FiefContentSchema = z.object({
  startingStocks: ResourceAmountsSchema,
  startingCapacity: WholeCountSchema,
  basePeasantSupply: WholeCountSchema,
  plotsPerProvince: WholeCountSchema.positive(),
  baseRates: ResourceAmountsSchema,
  terrainBonus: z.record(TerrainSchema, TerrainBonusSchema),
  buildQueueCap: WholeCountSchema,
  fiefCap: WholeCountSchema.positive(),
  seasons: SeasonCalendarSchema,
  units: z.record(UnitKindSchema, UnitTermsSchema),
  forage: ForageTermsSchema,
  camps: CampTermsSchema,
})

export type FiefContent = z.infer<typeof FiefContentSchema>
