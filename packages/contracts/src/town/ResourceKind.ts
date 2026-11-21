import { z } from 'zod'

export const ResourceKindSchema = z.enum(['money', 'food', 'power', 'material'])

export type ResourceKind = z.infer<typeof ResourceKindSchema>
