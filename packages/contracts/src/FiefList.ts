import { z } from 'zod'
import { ResourceKindSchema } from './ResourceKind'

const FiefSlotKindSchema = z.enum(['build', 'study', 'recruit', 'march'])

const FiefListEntrySchema = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1),
  coordinates: z.strictObject({
    kingdom: z.number().int().positive(),
    province: z.number().int().positive(),
    plot: z.number().int().positive(),
  }),
  freeSlots: z.array(FiefSlotKindSchema),
  fullStores: z.array(ResourceKindSchema),
})

export const FiefListSchema = z.strictObject({
  fiefs: z.array(FiefListEntrySchema),
})

export type FiefList = z.infer<typeof FiefListSchema>
