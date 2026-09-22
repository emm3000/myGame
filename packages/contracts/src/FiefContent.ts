import { z } from 'zod'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { ResourceKindSchema } from './ResourceKind'
import { QuantitySchema, WholeCountSchema } from './Wire'

const TerrainBonusSchema = z.object({
  resource: ResourceKindSchema,
  ratePerHour: QuantitySchema,
})

export const FiefContentSchema = z.object({
  startingStocks: ResourceAmountsSchema,
  startingCapacity: WholeCountSchema,
  basePeasantSupply: WholeCountSchema,
  terrainBonus: z.object({
    lowlands: TerrainBonusSchema,
    uplands: TerrainBonusSchema,
    ridges: TerrainBonusSchema,
  }),
})

export type FiefContent = z.infer<typeof FiefContentSchema>
