import { z } from 'zod'
import { ScaffoldSchema } from './Scaffold'

export const PlayerSchema = z.strictObject({
  id: z.uuid(),
  email: z.email(),
  emailVerified: z.boolean(),
  scaffold: ScaffoldSchema,
})

export type Player = z.infer<typeof PlayerSchema>
