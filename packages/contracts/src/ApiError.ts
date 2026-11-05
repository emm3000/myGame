import { z } from 'zod'
import { ApiErrorKindSchema } from './ApiErrorKind'
import { BuildingKindSchema as TownBuildingKindSchema } from './town/BuildingKind'
import { ResourceAmountsSchema as TownResourceAmountsSchema } from './town/ResourceAmounts'
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
      'WaitingListFull',
      'NotEnoughPeople',
      'NotEnoughResources',
      'TopLevelReached',
      'BuildingWorkNotFound',
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

const WaitingListFullErrorSchema = z
  .strictObject({
    kind: z.literal('WaitingListFull'),
    params: z.strictObject({ cap: WholeCountSchema }),
  })
  .meta({ id: 'WaitingListFullError' })

const NotEnoughPeopleErrorSchema = z
  .strictObject({
    kind: z.literal('NotEnoughPeople'),
    params: z.strictObject({
      requiredPeople: WholeCountSchema,
      freePeople: WholeCountSchema,
    }),
  })
  .meta({ id: 'NotEnoughPeopleError' })

const NotEnoughResourcesErrorSchema = z
  .strictObject({
    kind: z.literal('NotEnoughResources'),
    params: z.strictObject({ missing: TownResourceAmountsSchema }),
  })
  .meta({ id: 'NotEnoughResourcesError' })

const TopLevelReachedErrorSchema = z
  .strictObject({
    kind: z.literal('TopLevelReached'),
    params: z.strictObject({ building: TownBuildingKindSchema, level: WholeCountSchema }),
  })
  .meta({ id: 'TopLevelReachedError' })

const BuildingWorkNotFoundErrorSchema = z
  .strictObject({
    kind: z.literal('BuildingWorkNotFound'),
    params: z.strictObject({
      building: TownBuildingKindSchema,
      level: WholeCountSchema.positive(),
    }),
  })
  .meta({ id: 'BuildingWorkNotFoundError' })

export const ApiErrorSchema = z
  .discriminatedUnion('kind', [
    BareApiErrorSchema,
    NotEnoughUnitsAtHomeErrorSchema,
    BarracksTooLowErrorSchema,
    FiefCapReachedErrorSchema,
    CargoAboveCarryErrorSchema,
    StayOutOfRangeErrorSchema,
    WaitingListFullErrorSchema,
    NotEnoughPeopleErrorSchema,
    NotEnoughResourcesErrorSchema,
    TopLevelReachedErrorSchema,
    BuildingWorkNotFoundErrorSchema,
  ])
  .meta({ id: 'ApiError' })

export type ApiError = z.infer<typeof ApiErrorSchema>
