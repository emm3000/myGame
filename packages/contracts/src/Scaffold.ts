import { z } from 'zod'

export const ScaffoldSchema = z.enum(['es', 'none']).meta({ id: 'Scaffold' })

export type Scaffold = z.infer<typeof ScaffoldSchema>
