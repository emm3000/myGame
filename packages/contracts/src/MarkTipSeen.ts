import { z } from 'zod'
import { TipKindSchema } from './TipKind'

export const MarkTipSeenSchema = z.object({
  tip: TipKindSchema,
})

export type MarkTipSeen = z.infer<typeof MarkTipSeenSchema>
