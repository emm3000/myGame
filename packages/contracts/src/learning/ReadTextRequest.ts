import { z } from 'zod'

export const ReadTextRequestSchema = z.object({
  textId: z.string().min(1),
})

export type ReadTextRequest = z.infer<typeof ReadTextRequestSchema>
