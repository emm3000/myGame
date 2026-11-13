import { z } from 'zod'
import { LessonWordStateSchema } from './LessonState'
import { PlacementBandSchema } from './PlacementBand'
import { BuildingLevelSchema, DurationSecondsSchema, WholeCountSchema } from './Wire'

export const ReleasedLessonStateSchema = z.strictObject({
  id: z.string().min(1),
  band: PlacementBandSchema,
  position: WholeCountSchema.min(1),
  durationSeconds: DurationSecondsSchema.positive(),
  requiredSchoolLevel: BuildingLevelSchema,
  isStudied: z.boolean(),
  words: z.array(LessonWordStateSchema),
})
