import { z } from 'zod'
import { HoldoutCheckWeekSchema } from './HoldoutCheckWeek'
import { PlacementItemSchema } from './Placement'
import { PlacementBandSchema } from './PlacementBand'

const DueHoldoutCheckSchema = z
  .strictObject({
    kind: z.literal('due'),
    band: PlacementBandSchema,
    week: HoldoutCheckWeekSchema,
  })
  .meta({ id: 'DueHoldoutCheck' })

const AskingHoldoutCheckSchema = z
  .strictObject({
    kind: z.literal('asking'),
    band: PlacementBandSchema,
    week: HoldoutCheckWeekSchema,
    items: z.array(PlacementItemSchema),
  })
  .meta({ id: 'AskingHoldoutCheck' })

const HoldoutCheckStateSchema = z
  .discriminatedUnion('kind', [DueHoldoutCheckSchema, AskingHoldoutCheckSchema])
  .meta({ id: 'HoldoutCheckState' })

export const HoldoutChecksSchema = z
  .strictObject({ checks: z.array(HoldoutCheckStateSchema) })
  .meta({ id: 'HoldoutChecks' })

export type HoldoutChecks = z.infer<typeof HoldoutChecksSchema>
