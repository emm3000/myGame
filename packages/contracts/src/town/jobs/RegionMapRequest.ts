import { z } from 'zod'

export const RegionMapRequestSchema = z.object({
  area: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number),
})

export type RegionMapRequest = z.infer<typeof RegionMapRequestSchema>
