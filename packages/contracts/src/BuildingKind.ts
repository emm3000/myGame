import { z } from 'zod'

export const BuildingKindSchema = z.enum(['sawmill', 'quarry', 'ironMine', 'farm', 'warehouse'])

export type BuildingKind = z.infer<typeof BuildingKindSchema>
