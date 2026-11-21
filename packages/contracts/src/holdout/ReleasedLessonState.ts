import { z } from 'zod'
import { PlacementBandSchema } from '../placement/PlacementBand'
import { BuildingLevelSchema, DurationSecondsSchema, WholeCountSchema } from '../platform/Wire'
import { LessonWordStateSchema } from '../town/school/LessonState'

export const ReleasedLessonStateSchema = z.strictObject({
  id: z.string().min(1),
  band: PlacementBandSchema,
  position: WholeCountSchema.min(1),
  durationSeconds: DurationSecondsSchema.positive(),
  requiredSchoolLevel: BuildingLevelSchema,
  isStudied: z.boolean(),
  words: z.array(LessonWordStateSchema),
  enteringWordCount: WholeCountSchema,
})
