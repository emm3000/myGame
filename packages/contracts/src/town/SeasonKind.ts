import { z } from 'zod'

export const SeasonKindSchema = z.enum(['spring', 'summer', 'fall', 'winter'])

export type SeasonKind = z.infer<typeof SeasonKindSchema>
