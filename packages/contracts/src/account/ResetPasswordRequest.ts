import { z } from 'zod'

export const ResetPasswordRequestSchema = z.strictObject({
  token: z.string().min(1),
  password: z.string().min(8),
})

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>
