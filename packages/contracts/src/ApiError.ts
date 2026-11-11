import { z } from 'zod'
import { ApiErrorKindSchema } from './ApiErrorKind'
import { BuildingKindSchema } from './BuildingKind'
import { HireKindSchema } from './HireKind'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { InstantSchema, WholeCountSchema } from './Wire'

const BareApiErrorSchema = z
  .strictObject({
    kind: ApiErrorKindSchema.exclude([
      'WaitingListFull',
      'NotEnoughPeople',
      'NotEnoughResources',
      'TopLevelReached',
      'BuildingWorkNotFound',
      'LearningCapReached',
      'OfficeTooLow',
      'HiringSlotBusy',
      'HiringOrderNotFound',
      'JobHoursOutOfRange',
      'NotEnoughHiresAtHome',
    ]),
  })
  .meta({ id: 'BareApiError' })

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
    params: z.strictObject({ missing: ResourceAmountsSchema }),
  })
  .meta({ id: 'NotEnoughResourcesError' })

const TopLevelReachedErrorSchema = z
  .strictObject({
    kind: z.literal('TopLevelReached'),
    params: z.strictObject({ building: BuildingKindSchema, level: WholeCountSchema }),
  })
  .meta({ id: 'TopLevelReachedError' })

const BuildingWorkNotFoundErrorSchema = z
  .strictObject({
    kind: z.literal('BuildingWorkNotFound'),
    params: z.strictObject({
      building: BuildingKindSchema,
      level: WholeCountSchema.positive(),
    }),
  })
  .meta({ id: 'BuildingWorkNotFoundError' })

const LearningCapReachedErrorSchema = z
  .strictObject({
    kind: z.literal('LearningCapReached'),
    params: z.strictObject({
      learningCap: WholeCountSchema.positive(),
      cardsInLearning: WholeCountSchema,
    }),
  })
  .meta({ id: 'LearningCapReachedError' })

const OfficeTooLowErrorSchema = z
  .strictObject({
    kind: z.literal('OfficeTooLow'),
    params: z.strictObject({
      hire: HireKindSchema,
      requiredOfficeLevel: WholeCountSchema.positive(),
      officeLevel: WholeCountSchema,
    }),
  })
  .meta({ id: 'OfficeTooLowError' })

const HiringSlotBusyErrorSchema = z
  .strictObject({
    kind: z.literal('HiringSlotBusy'),
    params: z.strictObject({ hire: HireKindSchema }),
  })
  .meta({ id: 'HiringSlotBusyError' })

const HiringOrderNotFoundErrorSchema = z
  .strictObject({
    kind: z.literal('HiringOrderNotFound'),
    params: z.strictObject({ hire: HireKindSchema, startedAt: InstantSchema }),
  })
  .meta({ id: 'HiringOrderNotFoundError' })

const JobHoursOutOfRangeErrorSchema = z
  .strictObject({
    kind: z.literal('JobHoursOutOfRange'),
    params: z.strictObject({
      hours: WholeCountSchema.positive(),
      maxHours: WholeCountSchema.positive(),
    }),
  })
  .meta({ id: 'JobHoursOutOfRangeError' })

const NotEnoughHiresAtHomeErrorSchema = z
  .strictObject({
    kind: z.literal('NotEnoughHiresAtHome'),
    params: z.strictObject({
      hire: HireKindSchema,
      count: WholeCountSchema,
      atHome: WholeCountSchema,
    }),
  })
  .meta({ id: 'NotEnoughHiresAtHomeError' })

export const ApiErrorSchema = z
  .discriminatedUnion('kind', [
    BareApiErrorSchema,
    WaitingListFullErrorSchema,
    NotEnoughPeopleErrorSchema,
    NotEnoughResourcesErrorSchema,
    TopLevelReachedErrorSchema,
    BuildingWorkNotFoundErrorSchema,
    LearningCapReachedErrorSchema,
    OfficeTooLowErrorSchema,
    HiringSlotBusyErrorSchema,
    HiringOrderNotFoundErrorSchema,
    JobHoursOutOfRangeErrorSchema,
    NotEnoughHiresAtHomeErrorSchema,
  ])
  .meta({ id: 'ApiError' })

export type ApiError = z.infer<typeof ApiErrorSchema>
