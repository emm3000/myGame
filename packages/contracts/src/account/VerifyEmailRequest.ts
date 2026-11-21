import { z } from 'zod'

export const VerifyEmailRequestSchema = z.strictObject({
  token: z.string().min(1),
})

export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>
