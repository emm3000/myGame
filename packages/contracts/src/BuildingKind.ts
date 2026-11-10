import { z } from 'zod'

export const BuildingKindSchema = z.enum([
  'homes',
  'farm',
  'factory',
  'powerStation',
  'storage',
  'school',
  'office',
])

export type BuildingKind = z.infer<typeof BuildingKindSchema>
