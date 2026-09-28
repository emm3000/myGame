import { z } from 'zod'
import { ArtKindSchema } from './ArtKind'

export const CancelStudyRequestSchema = z.object({
  art: ArtKindSchema,
  targetLevel: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number),
})

export type CancelStudyRequest = z.infer<typeof CancelStudyRequestSchema>
