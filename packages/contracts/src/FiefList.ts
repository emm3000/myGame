import { z } from 'zod'

const FiefListEntrySchema = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1),
  coordinates: z.strictObject({
    kingdom: z.number().int().positive(),
    province: z.number().int().positive(),
    plot: z.number().int().positive(),
  }),
})

export const FiefListSchema = z.strictObject({
  fiefs: z.array(FiefListEntrySchema),
})

export type FiefList = z.infer<typeof FiefListSchema>
