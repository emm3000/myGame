import { z } from 'zod'
import { PlayerSchema } from './Player'

export const NativeSessionSchema = z.strictObject({
  token: z.string().min(1),
  player: PlayerSchema,
})

export type NativeSession = z.infer<typeof NativeSessionSchema>
