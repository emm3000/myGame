import { z } from 'zod'
import { ChromePhaseSchema } from './ChromePhase'
import { ScaffoldSchema } from './Scaffold'
import { ScaffoldVersionSchema } from './ScaffoldVersion'

export const PlayerSchema = z.strictObject({
  id: z.uuid(),
  email: z.email(),
  emailVerified: z.boolean(),
  scaffold: ScaffoldSchema,
  scaffoldVersion: ScaffoldVersionSchema,
  chromePhase: ChromePhaseSchema,
})

export type Player = z.infer<typeof PlayerSchema>
