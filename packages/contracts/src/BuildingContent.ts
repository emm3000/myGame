import { z } from 'zod'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { DurationSecondsSchema, QuantitySchema, WholeCountSchema } from './Wire'

const LevelSchema = z.object({
  level: z.number().int().positive(),
  cost: ResourceAmountsSchema,
  durationSeconds: DurationSecondsSchema,
  peasantOccupancy: WholeCountSchema,
})

const ProducerLevelsSchema = z
  .array(LevelSchema.extend({ effect: z.object({ ratePerHour: QuantitySchema }) }))
  .min(1)

const FarmLevelsSchema = z
  .array(
    LevelSchema.extend({
      effect: z.object({ ratePerHour: QuantitySchema, peasantSupply: WholeCountSchema }),
    }),
  )
  .min(1)

const WarehouseLevelsSchema = z
  .array(LevelSchema.extend({ effect: z.object({ capacity: WholeCountSchema }) }))
  .min(1)

export const BuildingContentSchema = z.discriminatedUnion('building', [
  z.object({ building: z.literal('sawmill'), levels: ProducerLevelsSchema }),
  z.object({ building: z.literal('quarry'), levels: ProducerLevelsSchema }),
  z.object({ building: z.literal('ironMine'), levels: ProducerLevelsSchema }),
  z.object({ building: z.literal('farm'), levels: FarmLevelsSchema }),
  z.object({ building: z.literal('warehouse'), levels: WarehouseLevelsSchema }),
])

export type BuildingContent = z.infer<typeof BuildingContentSchema>
