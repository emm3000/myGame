import { z } from 'zod'

export const ForgotPasswordRequestSchema = z.strictObject({
  email: z.email(),
})

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>
