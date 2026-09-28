import { z } from 'zod'

export const SeasonKindSchema = z.enum(['spring', 'summer', 'autumn', 'winter'])

export type SeasonKind = z.infer<typeof SeasonKindSchema>
