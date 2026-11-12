import { z } from 'zod'

export const TipKindSchema = z.enum([
  'people',
  'seasons',
  'waitingList',
  'office',
  'jobs',
  'fullStore',
])

export type TipKind = z.infer<typeof TipKindSchema>
