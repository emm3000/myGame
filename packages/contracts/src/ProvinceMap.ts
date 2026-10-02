import { z } from 'zod'
import { TerrainSchema } from './Terrain'
import { WholeCountSchema } from './Wire'

const PlotCampSchema = z.strictObject({
  tier: z.literal([1, 2, 3]),
  strength: WholeCountSchema,
})

const ProvincePlotSchema = z.strictObject({
  plot: z.number().int().min(1),
  fief: z.strictObject({ name: z.string(), isOwn: z.boolean() }).nullable(),
  camp: PlotCampSchema.nullable(),
  reservation: z.strictObject({ isOwn: z.boolean() }).nullable(),
})

export const ProvinceMapSchema = z.strictObject({
  kingdom: z.number().int().min(1),
  province: z.number().int().min(1),
  lastProvince: z.number().int().min(1),
  terrain: TerrainSchema,
  plots: z.array(ProvincePlotSchema),
})

export type ProvinceMap = z.infer<typeof ProvinceMapSchema>
