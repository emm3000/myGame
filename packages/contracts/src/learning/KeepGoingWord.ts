import { z } from 'zod'
import { FrameSpanSchema } from './FrameSpan'

export const KeepGoingWordSchema = z
  .strictObject({
    wordId: z.string().min(1),
    frames: z.array(z.array(FrameSpanSchema).min(1)).min(1),
  })
  .meta({ id: 'KeepGoingWord' })

export type KeepGoingWord = z.infer<typeof KeepGoingWordSchema>
