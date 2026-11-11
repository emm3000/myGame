import { z } from 'zod'
import { TerrainSchema } from './Terrain'
import { WholeCountSchema } from './Wire'

const RegionSiteSchema = z.strictObject({
  site: WholeCountSchema.positive(),
  town: z.strictObject({ name: z.string().min(1), isOwn: z.boolean() }).nullable(),
})

export const RegionMapSchema = z
  .strictObject({
    region: WholeCountSchema.positive(),
    area: WholeCountSchema.positive(),
    lastArea: WholeCountSchema.positive(),
    terrain: TerrainSchema,
    sites: z.array(RegionSiteSchema),
  })
  .meta({ id: 'RegionMap' })

export type RegionMap = z.infer<typeof RegionMapSchema>
