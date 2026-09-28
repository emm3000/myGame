import { z } from 'zod'
import { TerrainSchema } from './Terrain'

const ProvincePlotSchema = z.strictObject({
  plot: z.number().int().min(1),
  fief: z.strictObject({ name: z.string(), isOwn: z.boolean() }).nullable(),
})

export const ProvinceMapSchema = z.strictObject({
  kingdom: z.number().int().min(1),
  province: z.number().int().min(1),
  lastProvince: z.number().int().min(1),
  terrain: TerrainSchema,
  plots: z.array(ProvincePlotSchema),
})

export type ProvinceMap = z.infer<typeof ProvinceMapSchema>
