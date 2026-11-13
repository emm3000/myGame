import { z } from 'zod'
import { HoldoutCheckWeekSchema } from './HoldoutCheckWeek'
import { PlacementBandSchema } from './PlacementBand'

export const DueHoldoutCheckStateSchema = z.strictObject({
  band: PlacementBandSchema,
  week: HoldoutCheckWeekSchema,
})
