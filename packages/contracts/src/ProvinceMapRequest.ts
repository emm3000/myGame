import { z } from 'zod'

export const ProvinceMapRequestSchema = z.object({
  province: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number),
})

export type ProvinceMapRequest = z.infer<typeof ProvinceMapRequestSchema>
