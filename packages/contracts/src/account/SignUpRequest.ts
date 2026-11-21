import { z } from 'zod'
import { ScaffoldSchema } from './Scaffold'

export const SignUpRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  scaffold: ScaffoldSchema,
})

export type SignUpRequest = z.infer<typeof SignUpRequestSchema>
