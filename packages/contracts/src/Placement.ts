import { z } from 'zod'
import { PlacementBandSchema } from './PlacementBand'
import { InstantSchema, WholeCountSchema } from './Wire'

const PLACEMENT_SAMPLE_SIZE = 30

const CHOICE_COUNT = 4

const PlacementScoreSchema = z
  .strictObject({
    band: PlacementBandSchema,
    score: WholeCountSchema.max(PLACEMENT_SAMPLE_SIZE),
    takenAt: InstantSchema,
    isPlacedOut: z.boolean(),
  })
  .meta({ id: 'PlacementScore' })

export const PlacementItemSchema = z
  .strictObject({
    wordId: z.string().min(1),
    word: z.string().min(1),
    choices: z
      .array(z.strictObject({ choiceId: z.string().min(1), gloss: z.string().min(1) }))
      .min(1)
      .max(CHOICE_COUNT),
  })
  .meta({ id: 'PlacementItem' })

const OfferedPlacementSchema = z
  .strictObject({ kind: z.literal('offered') })
  .meta({ id: 'OfferedPlacement' })

const AskingPlacementSchema = z
  .strictObject({
    kind: z.literal('asking'),
    band: PlacementBandSchema,
    items: z.array(PlacementItemSchema).min(1).max(PLACEMENT_SAMPLE_SIZE),
    scores: z.array(PlacementScoreSchema),
  })
  .meta({ id: 'AskingPlacement' })

const ClosedPlacementSchema = z
  .strictObject({
    kind: z.literal('closed'),
    scores: z.array(PlacementScoreSchema),
  })
  .meta({ id: 'ClosedPlacement' })

export const PlacementSchema = z
  .discriminatedUnion('kind', [
    OfferedPlacementSchema,
    AskingPlacementSchema,
    ClosedPlacementSchema,
  ])
  .meta({ id: 'Placement' })

export type Placement = z.infer<typeof PlacementSchema>
