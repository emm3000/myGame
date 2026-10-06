import { z } from 'zod'
import { HintKindSchema } from './HintKind'

export const PlayerSchema = z.strictObject({
  id: z.uuid(),
  email: z.email(),
  emailVerified: z.boolean(),
  seenHints: z.array(HintKindSchema),
})

export type Player = z.infer<typeof PlayerSchema>
