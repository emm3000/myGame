import { z } from 'zod'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { ResourceKindSchema } from './ResourceKind'
import { TerrainSchema } from './Terrain'
import { QuantitySchema, WholeCountSchema } from './Wire'

const TerrainBonusSchema = z.object({
  resource: ResourceKindSchema,
  ratePerHour: QuantitySchema,
})

export const FiefContentSchema = z.object({
  startingStocks: ResourceAmountsSchema,
  startingCapacity: WholeCountSchema,
  basePeasantSupply: WholeCountSchema,
  plotsPerProvince: WholeCountSchema.positive(),
  baseRates: ResourceAmountsSchema,
  terrainBonus: z.record(TerrainSchema, TerrainBonusSchema),
})

export type FiefContent = z.infer<typeof FiefContentSchema>
