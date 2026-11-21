import { z } from 'zod'
import { PlacementBandSchema } from '../placement/PlacementBand'
import { HoldoutCheckWeekSchema } from './HoldoutCheckWeek'

export const DueHoldoutCheckStateSchema = z.strictObject({
  band: PlacementBandSchema,
  week: HoldoutCheckWeekSchema,
})
