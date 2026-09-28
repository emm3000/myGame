import { z } from 'zod'
import { FiefEventSchema } from './FiefEvent'

const longestChronicle = 100

export const FiefChronicleSchema = z.object({
  events: z.array(FiefEventSchema).max(longestChronicle),
})

export type FiefChronicle = z.infer<typeof FiefChronicleSchema>
