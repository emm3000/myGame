import { z } from 'zod'

export const SignInRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export type SignInRequest = z.infer<typeof SignInRequestSchema>
