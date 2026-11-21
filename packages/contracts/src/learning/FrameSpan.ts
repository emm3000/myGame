import { z } from 'zod'
import { WordSupportSchema } from './WordSupport'

export const FrameSpanSchema = z
  .strictObject({
    text: z.string().min(1),
    support: z.lazy(() => WordSupportSchema).nullable(),
  })
  .meta({ id: 'FrameSpan' })

export type FrameSpan = z.infer<typeof FrameSpanSchema>
