import { z } from 'zod'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { ResourceKindSchema } from './ResourceKind'
import { SeasonKindSchema } from './SeasonKind'
import { TerrainSchema } from './Terrain'
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
      road: WholeCountSchema.positive(),
    }),
  ),
})

const JobContentSchema = z.strictObject({
  secondsPerArea: WholeCountSchema.positive(),
  secondsPerSite: WholeCountSchema.positive(),
  maxHours: WholeCountSchema.positive(),
  payPerHour: z.record(
    TerrainSchema,
    z.strictObject({
      money: z.literal(0),
      food: WholeCountSchema,
      power: WholeCountSchema,
      material: WholeCountSchema,
    }),
  ),
})

const WasteSizeContentSchema = z.strictObject({
  maxWaste: WholeCountSchema.positive(),
  regrowHours: WholeCountSchema.positive(),
})

const WasteContentSchema = z.strictObject({
  siteFraction: QuantitySchema.max(1),
  moneyPerPoint: WholeCountSchema,
  materialPerPoint: WholeCountSchema,
  sizes: z.strictObject({
    1: WasteSizeContentSchema,
    2: WasteSizeContentSchema,
    3: WasteSizeContentSchema,
  }),
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
  job: JobContentSchema,
  waste: WasteContentSchema,
  seasons: TownSeasonsSchema,
})

export type TownContent = z.infer<typeof TownContentSchema>
