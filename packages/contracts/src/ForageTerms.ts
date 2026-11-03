import { z } from 'zod'
import { TerrainSchema } from './Terrain'
import { WholeCountSchema } from './Wire'

const ForageYieldSchema = z.strictObject({
  wood: WholeCountSchema,
  stone: WholeCountSchema,
  iron: WholeCountSchema,
  gold: WholeCountSchema.max(0),
  food: WholeCountSchema,
})

export const ForageTermsSchema = z.strictObject({
  secondsPerProvince: WholeCountSchema.positive(),
  secondsPerPlot: WholeCountSchema.positive(),
  maxStayHours: WholeCountSchema.positive(),
  yieldPerHour: z
    .record(TerrainSchema, ForageYieldSchema)
    .meta({ required: TerrainSchema.options }),
})
