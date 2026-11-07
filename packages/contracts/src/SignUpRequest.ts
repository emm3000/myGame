import { z } from 'zod'

export const SignUpRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export type SignUpRequest = z.infer<typeof SignUpRequestSchema>
