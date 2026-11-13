import { z } from 'zod'
import { ChromePhaseSchema } from './ChromePhase'
import { ScaffoldSchema } from './Scaffold'

export const PlayerSchema = z.strictObject({
  id: z.uuid(),
  email: z.email(),
  emailVerified: z.boolean(),
  scaffold: ScaffoldSchema,
  chromePhase: ChromePhaseSchema,
})

export type Player = z.infer<typeof PlayerSchema>
