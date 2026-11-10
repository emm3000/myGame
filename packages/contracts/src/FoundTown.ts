import { z } from 'zod'

export const FoundTownSchema = z
  .strictObject({ name: z.string().trim().min(1) })
  .meta({ id: 'FoundTown' })

export type FoundTown = z.infer<typeof FoundTownSchema>
