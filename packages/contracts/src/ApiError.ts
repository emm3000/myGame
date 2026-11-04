import { z } from 'zod'
import { ApiErrorKindSchema } from './ApiErrorKind'
import { UnitKindSchema } from './UnitKind'
import { WholeCountSchema } from './Wire'

const BareApiErrorSchema = z
  .strictObject({
    kind: ApiErrorKindSchema.exclude([
      'NotEnoughUnitsAtHome',
      'BarracksTooLow',
      'FiefCapReached',
      'CargoAboveCarry',
      'StayOutOfRange',
    ]),
  })
  .meta({ id: 'BareApiError' })

const NotEnoughUnitsAtHomeErrorSchema = z
  .strictObject({
    kind: z.literal('NotEnoughUnitsAtHome'),
    params: z.strictObject({
      unit: UnitKindSchema,
      count: WholeCountSchema.positive(),
      atHome: WholeCountSchema,
    }),
  })
  .meta({ id: 'NotEnoughUnitsAtHomeError' })

const BarracksTooLowErrorSchema = z
  .strictObject({
    kind: z.literal('BarracksTooLow'),
    params: z.strictObject({
      unit: UnitKindSchema,
      requiredBarracksLevel: WholeCountSchema.positive(),
    }),
  })
  .meta({ id: 'BarracksTooLowError' })

const FiefCapReachedErrorSchema = z
  .strictObject({
    kind: z.literal('FiefCapReached'),
    params: z.strictObject({ cap: WholeCountSchema.positive() }),
  })
  .meta({ id: 'FiefCapReachedError' })

const CargoAboveCarryErrorSchema = z
  .strictObject({
    kind: z.literal('CargoAboveCarry'),
    params: z.strictObject({ cargo: WholeCountSchema, carry: WholeCountSchema }),
  })
  .meta({ id: 'CargoAboveCarryError' })

const StayOutOfRangeErrorSchema = z
  .strictObject({
    kind: z.literal('StayOutOfRange'),
    params: z.strictObject({ maxStayHours: WholeCountSchema.positive() }),
  })
  .meta({ id: 'StayOutOfRangeError' })

export const ApiErrorSchema = z
  .discriminatedUnion('kind', [
    BareApiErrorSchema,
    NotEnoughUnitsAtHomeErrorSchema,
    BarracksTooLowErrorSchema,
    FiefCapReachedErrorSchema,
    CargoAboveCarryErrorSchema,
    StayOutOfRangeErrorSchema,
  ])
  .meta({ id: 'ApiError' })

export type ApiError = z.infer<typeof ApiErrorSchema>
