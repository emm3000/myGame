import { z } from 'zod'
import { KeepGoingWordSchema } from './KeepGoingWord'

export const KeepGoingFramesSchema = z
  .strictObject({
    words: z.array(KeepGoingWordSchema),
  })
  .meta({ id: 'KeepGoingFrames' })

export type KeepGoingFrames = z.infer<typeof KeepGoingFramesSchema>
