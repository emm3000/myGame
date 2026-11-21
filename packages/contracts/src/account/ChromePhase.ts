import { z } from 'zod'

export const ChromePhaseSchema = z.enum(['scaffold', 'both', 'english']).meta({ id: 'ChromePhase' })

export type ChromePhase = z.infer<typeof ChromePhaseSchema>
