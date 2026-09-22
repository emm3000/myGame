import { z } from 'zod'

export const PlayerSchema = z.object({
  id: z.uuid(),
  email: z.email(),
})

export type Player = z.infer<typeof PlayerSchema>
