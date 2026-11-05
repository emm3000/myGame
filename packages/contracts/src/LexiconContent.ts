import { z } from 'zod'

const LexiconEntrySchema = z.strictObject({
  id: z.string().min(1),
  lemma: z.string().min(1),
  partOfSpeech: z.enum(['noun', 'verb', 'adjective', 'adverb']),
  frame: z.string().min(1),
  gappedFrame: z.string().min(1),
  gloss: z.strictObject({ es: z.string().min(1).optional() }),
  definition: z.string().min(1).optional(),
  acceptedForms: z.array(z.string().min(1)).optional(),
  homographs: z.record(z.string().min(1), z.string().min(1)).optional(),
  isOffList: z.literal(true).optional(),
})

export const LexiconContentSchema = z.array(LexiconEntrySchema).min(1)

export type LexiconContent = z.infer<typeof LexiconContentSchema>
