import { z } from 'zod'
import { FrameSpanSchema } from './FrameSpan'

export const OpenTextSchema = z
  .strictObject({
    id: z.string().min(1),
    title: z.string().min(1),
    sentences: z.array(z.array(FrameSpanSchema).min(1)).min(1),
  })
  .meta({ id: 'OpenText' })

export type OpenText = z.infer<typeof OpenTextSchema>
