import { z } from 'zod'

export const PlayerSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  emailVerified: z.boolean(),
})

export type Player = z.infer<typeof PlayerSchema>
