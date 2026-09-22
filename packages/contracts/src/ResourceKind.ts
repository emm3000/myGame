import { z } from 'zod'

export const ResourceKindSchema = z.enum(['wood', 'stone', 'iron', 'gold', 'food'])

export type ResourceKind = z.infer<typeof ResourceKindSchema>
