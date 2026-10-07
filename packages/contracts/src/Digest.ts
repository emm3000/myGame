import { z } from 'zod'
import { FiefEventSchema } from './FiefEvent'
import { ResourceKindSchema } from './ResourceKind'
import { InstantSchema } from './Wire'

const FilledStoreSchema = z.strictObject({
  resource: ResourceKindSchema,
  fullSince: InstantSchema,
})

const DigestFiefSchema = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1),
  events: z.array(FiefEventSchema),
  stores: z.array(FilledStoreSchema),
})

export const DigestSchema = z.strictObject({
  acknowledgedAt: InstantSchema,
  isDue: z.boolean(),
  fiefs: z.array(DigestFiefSchema),
})

export type Digest = z.infer<typeof DigestSchema>
