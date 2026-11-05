import { z } from 'zod'

export const GrammarContentSchema = z.strictObject({
  frameWords: z
    .array(z.strictObject({ word: z.string().min(1), admittingLessonId: z.string().min(1) }))
    .min(1),
})

export type GrammarContent = z.infer<typeof GrammarContentSchema>
