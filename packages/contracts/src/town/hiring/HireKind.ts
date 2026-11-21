import { z } from 'zod'

export const HireKindSchema = z.enum(['worker', 'truck'])

export type HireKind = z.infer<typeof HireKindSchema>
