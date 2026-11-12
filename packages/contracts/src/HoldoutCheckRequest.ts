import { z } from 'zod'
import { HoldoutCheckWeekSchema } from './HoldoutCheckWeek'
import { PlacementBandSchema } from './PlacementBand'

export const HoldoutCheckRequestSchema = z.object({
  band: z.string().regex(/^\d+$/).transform(Number).pipe(PlacementBandSchema),
  week: z.string().regex(/^\d+$/).transform(Number).pipe(HoldoutCheckWeekSchema),
})

export type HoldoutCheckRequest = z.infer<typeof HoldoutCheckRequestSchema>
