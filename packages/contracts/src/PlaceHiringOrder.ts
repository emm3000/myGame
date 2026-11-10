import { z } from 'zod'
import { HireKindSchema } from './HireKind'
import { WholeCountSchema } from './Wire'

export const PlaceHiringOrderSchema = z
  .strictObject({ hire: HireKindSchema, count: WholeCountSchema.positive() })
  .meta({ id: 'PlaceHiringOrder' })

export type PlaceHiringOrder = z.infer<typeof PlaceHiringOrderSchema>
