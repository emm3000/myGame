import { z } from 'zod'

export const TerrainSchema = z.enum(['lowlands', 'uplands', 'ridges'])

export type Terrain = z.infer<typeof TerrainSchema>
