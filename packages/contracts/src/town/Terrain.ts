import { z } from 'zod'

export const TerrainSchema = z.enum(['fields', 'river', 'hills'])

export type Terrain = z.infer<typeof TerrainSchema>
