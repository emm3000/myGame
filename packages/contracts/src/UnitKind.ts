import { z } from 'zod'

export const UnitKindSchema = z.enum(['infantry', 'cavalry'])

export type UnitKind = z.infer<typeof UnitKindSchema>
