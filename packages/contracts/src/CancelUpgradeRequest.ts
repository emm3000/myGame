import { z } from 'zod'

export const CancelUpgradeRequestSchema = z.object({
  position: z.string().regex(/^\d+$/).transform(Number),
})

export type CancelUpgradeRequest = z.infer<typeof CancelUpgradeRequestSchema>
