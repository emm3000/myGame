import { z } from 'zod'

export const UnitKindSchema = z.enum(['infantry', 'cavalry', 'archer', 'settler'])

export type UnitKind = z.infer<typeof UnitKindSchema>
