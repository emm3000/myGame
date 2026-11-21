import { z } from 'zod'
import { PlacementBandSchema } from '../placement/PlacementBand'
import { HoldoutCheckWeekSchema } from './HoldoutCheckWeek'

export const HoldoutCheckRequestSchema = z.object({
  band: z.string().regex(/^\d+$/).transform(Number).pipe(PlacementBandSchema),
  week: z.string().regex(/^\d+$/).transform(Number).pipe(HoldoutCheckWeekSchema),
})

export type HoldoutCheckRequest = z.infer<typeof HoldoutCheckRequestSchema>
