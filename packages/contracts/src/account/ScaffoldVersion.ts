import { z } from 'zod'

export const ScaffoldVersionSchema = z.number().int().nonnegative().meta({
  id: 'ScaffoldVersion',
  description:
    'An opaque ordering of the scaffold changes the server applied: a read carrying a greater version saw a later change.',
})

export type ScaffoldVersion = z.infer<typeof ScaffoldVersionSchema>
