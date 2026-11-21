import { z } from 'zod'
import { PlacementBandSchema } from './PlacementBand'

const PLACEMENT_SAMPLE_SIZE = 30

export const PlacementAnswersSchema = z
  .strictObject({
    band: PlacementBandSchema,
    answers: z
      .array(z.strictObject({ wordId: z.string().min(1), choiceId: z.string().min(1) }))
      .min(1)
      .max(PLACEMENT_SAMPLE_SIZE),
  })
  .meta({ id: 'PlacementAnswers' })

export type PlacementAnswers = z.infer<typeof PlacementAnswersSchema>
