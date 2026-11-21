import { z } from 'zod'
import { ScaffoldSchema } from './Scaffold'

export const ScaffoldChangeSchema = z.strictObject({
  scaffold: ScaffoldSchema,
})

export type ScaffoldChange = z.infer<typeof ScaffoldChangeSchema>
