import { z } from 'zod'
import {
  DurationSecondsSchema,
  InstantSchema,
  QuantitySchema,
  WholeCountSchema,
} from '../platform/Wire'
import { BuildingKindSchema } from '../town/building/BuildingKind'
import { TipKindSchema } from '../town/guidance/TipKind'
import { ResourceAmountsSchema } from '../town/ResourceAmounts'
import { ResourceKindSchema } from '../town/ResourceKind'
import { SeasonDurationPercentSchema } from '../town/SeasonDurationPercent'
import { SeasonKindSchema } from '../town/SeasonKind'
import { TerrainSchema } from '../town/Terrain'

const TownSeasonsSchema = z.strictObject({
  epoch: InstantSchema,
  daysPerSeason: WholeCountSchema.positive(),
  productionPercent: z.record(
    SeasonKindSchema,
    z.record(ResourceKindSchema, WholeCountSchema.positive()),
  ),
  durationPercent: z.record(SeasonKindSchema, SeasonDurationPercentSchema),
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

const GoalContentSchema = z.strictObject({
  building: BuildingKindSchema,
  level: WholeCountSchema.positive(),
})

const TipsContentSchema = z
  .array(TipKindSchema)
  .refine((tips) => new Set(tips).size === tips.length)

const WordNeedContentSchema = z.strictObject({
  fromLevel: WholeCountSchema.positive(),
  perLevel: WholeCountSchema.positive(),
  retainedFromLevel: WholeCountSchema.positive(),
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
  awayAfterSeconds: DurationSecondsSchema.positive(),
  wordNeed: WordNeedContentSchema,
  job: JobContentSchema,
  waste: WasteContentSchema,
  seasons: TownSeasonsSchema,
  goals: z.array(GoalContentSchema),
  tips: TipsContentSchema,
})

export type TownContent = z.infer<typeof TownContentSchema>
