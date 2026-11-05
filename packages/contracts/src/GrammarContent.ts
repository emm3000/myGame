import { z } from 'zod'

const CefrjLevelSchema = z.enum([
  'A1.1',
  'A1.2',
  'A1.3',
  'A2.1',
  'A2.2',
  'B1.1',
  'B1.2',
  'B2.1',
  'B2.2',
])

const GrammarStructureSchema = z.strictObject({
  name: z.string().min(1),
  cefr: CefrjLevelSchema,
  cefrjItem: z.string().min(1),
  admittingLessonId: z.string().min(1),
  frameWords: z.array(z.string().min(1)),
  inflections: z.array(z.string().min(1)),
})

export const GrammarContentSchema = z.strictObject({
  structures: z.array(GrammarStructureSchema).min(1),
})

export type GrammarContent = z.infer<typeof GrammarContentSchema>
