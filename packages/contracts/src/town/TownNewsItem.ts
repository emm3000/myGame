import { z } from 'zod'
import { BuildingLevelSchema, InstantSchema, WholeCountSchema } from '../Wire'
import { BuildingKindSchema } from './BuildingKind'
import { HireKindSchema } from './HireKind'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { ResourceKindSchema } from './ResourceKind'
import { SiteAddressSchema } from './SiteAddress'

const LessonIdSchema = z.string().min(1)

const BuildingWorkFinishedNewsSchema = z
  .strictObject({
    kind: z.literal('buildingWorkFinished'),
    params: z.strictObject({ building: BuildingKindSchema, level: BuildingLevelSchema }),
    occurredAt: InstantSchema,
  })
  .meta({ id: 'BuildingWorkFinishedNews' })

const BuildingWorkStoppedNewsSchema = z
  .strictObject({
    kind: z.literal('buildingWorkStopped'),
    params: z.strictObject({
      building: BuildingKindSchema,
      level: BuildingLevelSchema,
      refund: ResourceAmountsSchema,
    }),
    occurredAt: InstantSchema,
  })
  .meta({ id: 'BuildingWorkStoppedNews' })

const LessonStudiedNewsSchema = z
  .strictObject({
    kind: z.literal('lessonStudied'),
    params: z.strictObject({ lessonId: LessonIdSchema }),
    occurredAt: InstantSchema,
  })
  .meta({ id: 'LessonStudiedNews' })

const LessonStoppedNewsSchema = z
  .strictObject({
    kind: z.literal('lessonStopped'),
    params: z.strictObject({ lessonId: LessonIdSchema }),
    occurredAt: InstantSchema,
  })
  .meta({ id: 'LessonStoppedNews' })

const SkillEarnedNewsSchema = z
  .strictObject({
    kind: z.literal('skillEarned'),
    params: z.strictObject({
      lessonId: LessonIdSchema,
      resource: ResourceKindSchema,
      ratePercent: WholeCountSchema.positive(),
    }),
    occurredAt: InstantSchema,
  })
  .meta({ id: 'SkillEarnedNews' })

const HiringDeliveredNewsSchema = z
  .strictObject({
    kind: z.literal('hiringDelivered'),
    params: z.strictObject({ hire: HireKindSchema, count: WholeCountSchema.positive() }),
    occurredAt: InstantSchema,
  })
  .meta({ id: 'HiringDeliveredNews' })

const HiringStoppedNewsSchema = z
  .strictObject({
    kind: z.literal('hiringStopped'),
    params: z.strictObject({
      hire: HireKindSchema,
      delivered: WholeCountSchema,
      stopped: WholeCountSchema.positive(),
      refund: ResourceAmountsSchema,
    }),
    occurredAt: InstantSchema,
  })
  .meta({ id: 'HiringStoppedNews' })

const JobBackNewsSchema = z
  .strictObject({
    kind: z.literal('jobBack'),
    params: z.strictObject({ site: SiteAddressSchema, pay: ResourceAmountsSchema }),
    occurredAt: InstantSchema,
  })
  .meta({ id: 'JobBackNews' })

const JobCalledBackNewsSchema = z
  .strictObject({
    kind: z.literal('jobCalledBack'),
    params: z.strictObject({ site: SiteAddressSchema, pay: ResourceAmountsSchema }),
    occurredAt: InstantSchema,
  })
  .meta({ id: 'JobCalledBackNews' })

const CleanUpDoneNewsSchema = z
  .strictObject({
    kind: z.literal('cleanUpDone'),
    params: z.strictObject({ site: SiteAddressSchema, reward: ResourceAmountsSchema }),
    occurredAt: InstantSchema,
  })
  .meta({ id: 'CleanUpDoneNews' })

const CleanUpFailedNewsSchema = z
  .strictObject({
    kind: z.literal('cleanUpFailed'),
    params: z.strictObject({ site: SiteAddressSchema }),
    occurredAt: InstantSchema,
  })
  .meta({ id: 'CleanUpFailedNews' })

const BecameCityNewsSchema = z
  .strictObject({ kind: z.literal('becameCity'), occurredAt: InstantSchema })
  .meta({ id: 'BecameCityNews' })

export const TownNewsItemSchema = z
  .discriminatedUnion('kind', [
    BuildingWorkFinishedNewsSchema,
    BuildingWorkStoppedNewsSchema,
    LessonStudiedNewsSchema,
    LessonStoppedNewsSchema,
    SkillEarnedNewsSchema,
    HiringDeliveredNewsSchema,
    HiringStoppedNewsSchema,
    JobBackNewsSchema,
    JobCalledBackNewsSchema,
    CleanUpDoneNewsSchema,
    CleanUpFailedNewsSchema,
    BecameCityNewsSchema,
  ])
  .meta({ id: 'TownNewsItem' })

export type TownNewsItem = z.infer<typeof TownNewsItemSchema>
