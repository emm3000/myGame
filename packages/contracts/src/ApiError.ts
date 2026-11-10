import { z } from 'zod'
import { ApiErrorKindSchema } from './ApiErrorKind'
import { BuildingKindSchema } from './BuildingKind'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { WholeCountSchema } from './Wire'

const BareApiErrorSchema = z
  .strictObject({
    kind: ApiErrorKindSchema.exclude([
      'WaitingListFull',
      'NotEnoughPeople',
      'NotEnoughResources',
      'TopLevelReached',
      'BuildingWorkNotFound',
      'LearningCapReached',
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

export const ApiErrorSchema = z
  .discriminatedUnion('kind', [
    BareApiErrorSchema,
    WaitingListFullErrorSchema,
    NotEnoughPeopleErrorSchema,
    NotEnoughResourcesErrorSchema,
    TopLevelReachedErrorSchema,
    BuildingWorkNotFoundErrorSchema,
    LearningCapReachedErrorSchema,
  ])
  .meta({ id: 'ApiError' })

export type ApiError = z.infer<typeof ApiErrorSchema>
