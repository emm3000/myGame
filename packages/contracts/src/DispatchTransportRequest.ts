import { z } from 'zod'
import { PartySchema } from './Party'
import { ResourceAmountsSchema } from './ResourceAmounts'

export const DispatchTransportRequestSchema = z.strictObject({
  toFiefId: z.uuid(),
  units: PartySchema,
  cargo: ResourceAmountsSchema,
})

export type DispatchTransportRequest = z.infer<typeof DispatchTransportRequestSchema>
