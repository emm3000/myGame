import { z } from 'zod'

export const BuildingKindSchema = z.enum([
  'sawmill',
  'quarry',
  'ironMine',
  'farm',
  'warehouse',
  'library',
])

export type BuildingKind = z.infer<typeof BuildingKindSchema>
