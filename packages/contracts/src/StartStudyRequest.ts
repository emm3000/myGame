import { z } from 'zod'
import { ArtKindSchema } from './ArtKind'

export const StartStudyRequestSchema = z.object({
  art: ArtKindSchema,
})

export type StartStudyRequest = z.infer<typeof StartStudyRequestSchema>
