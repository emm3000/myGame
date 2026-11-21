import { z } from 'zod'

export const PlacementBandSchema = z
  .enum({ first: 1, second: 2, third: 3 })
  .meta({ id: 'PlacementBand' })

export type PlacementBand = z.infer<typeof PlacementBandSchema>
