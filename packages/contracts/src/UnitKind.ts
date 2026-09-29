import { z } from 'zod'

export const UnitKindSchema = z.enum(['infantry'])

export type UnitKind = z.infer<typeof UnitKindSchema>
