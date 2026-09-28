import { z } from 'zod'

export const ArtKindSchema = z.enum(['smithing', 'masonry'])

export type ArtKind = z.infer<typeof ArtKindSchema>
