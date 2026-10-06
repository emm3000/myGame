import { z } from 'zod'

export const HintKindSchema = z.enum([
  'peasants',
  'seasons',
  'queue',
  'library',
  'barracks',
  'marches',
  'fullStore',
])

export type HintKind = z.infer<typeof HintKindSchema>
