import { z } from 'zod'

export const TextTitleSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
})
