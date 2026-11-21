import { z } from 'zod'
import { ChromePhaseSchema } from '../account/ChromePhase'
import { ScaffoldSchema } from '../account/Scaffold'
import { ScaffoldVersionSchema } from '../account/ScaffoldVersion'
import { DueHoldoutCheckStateSchema } from '../holdout/DueHoldoutCheckState'
import { ReleasedLessonStateSchema } from '../holdout/ReleasedLessonState'
import { TextTitleSchema } from '../learning/TextTitle'
import { PlacementBandSchema } from '../placement/PlacementBand'
import {
  BuildingLevelSchema,
  DurationSecondsSchema,
  InstantSchema,
  QuantitySchema,
  WholeCountSchema,
} from '../platform/Wire'
import { BuildingKindSchema } from './building/BuildingKind'
import { BuildingWorkSchema } from './building/BuildingWork'
import { NeededWordKindSchema } from './building/NeededWordKind'
import { EarnedSkillSchema } from './EarnedSkill'
import { NextStepSchema } from './guidance/NextStep'
import { TipKindSchema } from './guidance/TipKind'
import { HireKindSchema } from './hiring/HireKind'
import { TownJobSchema } from './jobs/TownJob'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { ResourceKindSchema } from './ResourceKind'
import { SeasonDurationPercentSchema } from './SeasonDurationPercent'
import { SeasonKindSchema } from './SeasonKind'
import { SiteAddressSchema } from './SiteAddress'
import { LessonStateSchema } from './school/LessonState'
import { TerrainSchema } from './Terrain'

const StockSchema = z.strictObject({
  amount: WholeCountSchema,
  ratePerHour: QuantitySchema,
  capacity: WholeCountSchema,
  fullAt: InstantSchema.nullable(),
})

const WordsNeededSchema = z.strictObject({
  count: WholeCountSchema.positive(),
  standing: NeededWordKindSchema,
})

const NextLevelSchema = z.strictObject({
  level: BuildingLevelSchema,
  cost: ResourceAmountsSchema,
  durationSeconds: DurationSecondsSchema,
  people: WholeCountSchema,
  wordsNeeded: WordsNeededSchema.nullable(),
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

const BandLineSchema = z.strictObject({
  band: PlacementBandSchema,
  count: WholeCountSchema,
  total: WholeCountSchema.positive(),
})

const LearningLoadSchema = z.strictObject({
  cap: WholeCountSchema.positive(),
  inLearning: WholeCountSchema,
  retainedWords: RetainedWordsSchema.nullable(),
  nextInLearningDueAt: InstantSchema.nullable(),
})

const TownSeasonSchema = z.strictObject({
  kind: SeasonKindSchema,
  year: WholeCountSchema.positive(),
  endsAt: InstantSchema,
  productionPercent: z
    .record(ResourceKindSchema, WholeCountSchema.positive())
    .meta({ required: ResourceKindSchema.options }),
  durationPercent: SeasonDurationPercentSchema,
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
    releasedLessons: z.array(ReleasedLessonStateSchema),
    texts: z.array(TextTitleSchema),
    dueHoldoutChecks: z.array(DueHoldoutCheckStateSchema),
    hasBandStarted: z.boolean(),
    bandLines: z.array(BandLineSchema),
    skills: z.array(EarnedSkillSchema),
    lessonSlot: LessonUnderStudySchema.nullable(),
    learning: LearningLoadSchema,
    stableWordCount: WholeCountSchema,
    retainedWordCount: WholeCountSchema,
    nextStep: NextStepSchema,
    tip: TipKindSchema.nullable(),
    chromePhase: ChromePhaseSchema,
    scaffold: ScaffoldSchema,
    scaffoldVersion: ScaffoldVersionSchema,
    nextDueAt: InstantSchema.nullable(),
    readAt: InstantSchema,
  })
  .meta({ id: 'TownOverview' })

export type TownOverview = z.infer<typeof TownOverviewSchema>
