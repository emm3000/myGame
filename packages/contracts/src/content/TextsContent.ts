import { z } from 'zod'
import { HomographsSchema } from './Homographs'
import { NoCardSenseSchema } from './NoCardSense'

const TextContentSchema = z.strictObject({
  id: z.string().min(1),
  fromLessonId: z.string().min(1),
  title: z.string().min(1),
  sentences: z.array(z.string().min(1)).min(1),
  homographs: HomographsSchema.optional(),
  noCardSense: NoCardSenseSchema.optional(),
})

export const TextsContentSchema = z.array(TextContentSchema).min(1)

export type TextsContent = z.infer<typeof TextsContentSchema>
