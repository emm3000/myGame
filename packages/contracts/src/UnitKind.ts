import { z } from 'zod'

export const UnitKindSchema = z.enum(['infantry', 'cavalry', 'settler'])

export type UnitKind = z.infer<typeof UnitKindSchema>
