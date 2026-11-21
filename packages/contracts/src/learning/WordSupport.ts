import { z } from 'zod'

export const WordSupportSchema = z
  .strictObject({
    shown: z.enum(['beside', 'onTap']),
    text: z.string().min(1),
    language: z.enum(['es', 'en']),
  })
  .meta({ id: 'WordSupport' })

export type WordSupport = z.infer<typeof WordSupportSchema>
