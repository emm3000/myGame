import { z } from 'zod'
import { BuildingKindSchema } from './BuildingKind'
import { BuildingWorkSchema } from './BuildingWork'
import { EarnedSkillSchema } from './EarnedSkill'
import { HireKindSchema } from './HireKind'
import { LessonStateSchema } from './LessonState'
import { NextStepSchema } from './NextStep'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { ResourceKindSchema } from './ResourceKind'
import { SeasonKindSchema } from './SeasonKind'
import { SiteAddressSchema } from './SiteAddress'
import { TerrainSchema } from './Terrain'
import { TipKindSchema } from './TipKind'
import { TownJobSchema } from './TownJob'
import {
  BuildingLevelSchema,
  DurationSecondsSchema,
  InstantSchema,
  QuantitySchema,
  WholeCountSchema,
} from './Wire'

const StockSchema = z.strictObject({
  amount: WholeCountSchema,
  ratePerHour: QuantitySchema,
  capacity: WholeCountSchema,
})

const NextLevelSchema = z.strictObject({
  level: BuildingLevelSchema,
  cost: ResourceAmountsSchema,
  durationSeconds: DurationSecondsSchema,
  people: WholeCountSchema,
})

const BuildingStateSchema = z.strictObject({
  level: WholeCountSchema,
  nextLevel: NextLevelSchema.nullable(),
})

const LessonUnderStudySchema = z.strictObject({
  lessonId: z.string().min(1),
  startedAt: InstantSchema,
  finishesAt: InstantSchema,
})

const RetainedWordsSchema = z.strictObject({
  count: WholeCountSchema,
  total: WholeCountSchema.positive(),
})

const LearningLoadSchema = z.strictObject({
  cap: WholeCountSchema.positive(),
  inLearning: WholeCountSchema,
  retainedWords: RetainedWordsSchema.nullable(),
})

const TownSeasonSchema = z.strictObject({
  kind: SeasonKindSchema,
  year: WholeCountSchema.positive(),
  endsAt: InstantSchema,
})

const HiringOrderStateSchema = z.strictObject({
  hire: HireKindSchema,
  count: WholeCountSchema.positive(),
  delivered: WholeCountSchema,
  secondsPerHire: DurationSecondsSchema.positive(),
  startedAt: InstantSchema,
  endsAt: InstantSchema,
})

const HireTermsStateSchema = z.strictObject({
  cost: ResourceAmountsSchema,
  secondsPerHire: DurationSecondsSchema.positive(),
  people: WholeCountSchema,
  requiredOfficeLevel: WholeCountSchema.positive(),
})

export const TownOverviewSchema = z
  .strictObject({
    name: z.string().min(1),
    label: z.enum(['town', 'city']),
    site: SiteAddressSchema,
    terrain: TerrainSchema,
    season: TownSeasonSchema.nullable(),
    stocks: z
      .record(ResourceKindSchema, StockSchema)
      .meta({ required: ResourceKindSchema.options }),
    people: z.strictObject({
      supplied: WholeCountSchema,
      free: WholeCountSchema,
      atWork: WholeCountSchema,
    }),
    buildings: z
      .record(BuildingKindSchema, BuildingStateSchema)
      .meta({ required: BuildingKindSchema.options }),
    work: z.strictObject({
      slot: z.lazy(() => BuildingWorkSchema).nullable(),
      waitingList: z.array(BuildingWorkSchema),
      cap: WholeCountSchema,
    }),
    hiring: z.strictObject({
      order: HiringOrderStateSchema.nullable(),
      hires: z.record(HireKindSchema, WholeCountSchema).meta({ required: HireKindSchema.options }),
      terms: z
        .record(HireKindSchema, HireTermsStateSchema)
        .meta({ required: HireKindSchema.options }),
    }),
    job: z.lazy(() => TownJobSchema).nullable(),
    lessons: z.array(LessonStateSchema),
    skills: z.array(EarnedSkillSchema),
    lessonSlot: LessonUnderStudySchema.nullable(),
    learning: LearningLoadSchema,
    nextStep: NextStepSchema,
    tip: TipKindSchema.nullable(),
    nextDueAt: InstantSchema.nullable(),
    readAt: InstantSchema,
  })
  .meta({ id: 'TownOverview' })

export type TownOverview = z.infer<typeof TownOverviewSchema>
