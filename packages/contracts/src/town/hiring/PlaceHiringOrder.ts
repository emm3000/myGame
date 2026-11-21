import { z } from 'zod'
import { WholeCountSchema } from '../../platform/Wire'
import { HireKindSchema } from './HireKind'

export const PlaceHiringOrderSchema = z
  .strictObject({ hire: HireKindSchema, count: WholeCountSchema.positive() })
  .meta({ id: 'PlaceHiringOrder' })

export type PlaceHiringOrder = z.infer<typeof PlaceHiringOrderSchema>
