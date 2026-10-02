import { z } from 'zod'

export const FiefRequestSchema = z.object({
  fiefId: z.uuid(),
})

export type FiefRequest = z.infer<typeof FiefRequestSchema>
