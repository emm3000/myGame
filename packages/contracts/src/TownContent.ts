import { z } from 'zod'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { ResourceKindSchema } from './ResourceKind'
import { SeasonKindSchema } from './SeasonKind'
import { InstantSchema, QuantitySchema, WholeCountSchema } from './Wire'

const TownSeasonsSchema = z.strictObject({
  epoch: InstantSchema,
  daysPerSeason: WholeCountSchema.positive(),
  productionPercent: z.record(
    SeasonKindSchema,
    z.record(ResourceKindSchema, WholeCountSchema.positive()),
  ),
  durationPercent: z.record(
    SeasonKindSchema,
    z.strictObject({
      build: WholeCountSchema.positive(),
      study: WholeCountSchema.positive(),
      hire: WholeCountSchema.positive(),
    }),
  ),
})

export const TownContentSchema = z.strictObject({
  startingStocks: ResourceAmountsSchema,
  taxRatePerHour: QuantitySchema,
  basePeople: WholeCountSchema,
  cityPeople: WholeCountSchema.positive(),
  storageBaseCapacity: WholeCountSchema.positive(),
  sitesPerArea: WholeCountSchema.positive(),
  terrainBonusPerHour: QuantitySchema,
  waitingListCap: WholeCountSchema,
  seasons: TownSeasonsSchema,
})

export type TownContent = z.infer<typeof TownContentSchema>
