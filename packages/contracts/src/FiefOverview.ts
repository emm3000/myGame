import { z } from 'zod'
import { ArtKindSchema } from './ArtKind'
import { BuildingKindSchema } from './BuildingKind'
import { CampTiersSchema } from './CampTiers'
import { EarnedSkillSchema } from './EarnedSkill'
import { ForageTermsSchema } from './ForageTerms'
import { PartySchema } from './Party'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { ResourceKindSchema } from './ResourceKind'
import { SeasonDurationPercentSchema } from './SeasonDurationPercent'
import { SeasonKindSchema } from './SeasonKind'
import { TerrainSchema } from './Terrain'
import { UnitCountsSchema } from './UnitCounts'
import { UnitKindSchema } from './UnitKind'
import {
  BuildingLevelSchema,
  CampTierSchema,
  DurationSecondsSchema,
  InstantSchema,
  QuantitySchema,
  WholeCountSchema,
} from './Wire'

const ResourceStateSchema = z.object({
  amount: QuantitySchema,
  ratePerHour: QuantitySchema,
  capacity: WholeCountSchema,
  fullAt: InstantSchema.nullable(),
})

const NextLevelSchema = z.object({
  level: BuildingLevelSchema,
  cost: ResourceAmountsSchema,
  durationSeconds: DurationSecondsSchema,
  peasants: WholeCountSchema,
})

const BuildingStateSchema = z.object({
  level: WholeCountSchema,
  nextLevel: NextLevelSchema.nullable(),
})

const IdleBuildSlotSchema = z
  .object({
    kind: z.literal('idle'),
  })
  .meta({ id: 'IdleBuildSlot' })

const BusyBuildSlotSchema = z
  .object({
    kind: z.literal('busy'),
    building: BuildingKindSchema,
    targetLevel: BuildingLevelSchema,
    startedAt: InstantSchema,
    finishesAt: InstantSchema,
  })
  .meta({ id: 'BusyBuildSlot' })

const IdleStudySlotSchema = z
  .object({
    kind: z.literal('idle'),
  })
  .meta({ id: 'IdleStudySlot' })

const BusyStudySlotSchema = z
  .object({
    kind: z.literal('busy'),
    art: ArtKindSchema,
    targetLevel: BuildingLevelSchema,
    startedAt: InstantSchema,
    finishesAt: InstantSchema,
    cost: ResourceAmountsSchema,
  })
  .meta({ id: 'BusyStudySlot' })

const LessonStudySlotSchema = z
  .strictObject({
    kind: z.literal('lesson'),
    lessonId: z.string().min(1),
    startedAt: InstantSchema,
    finishesAt: InstantSchema,
  })
  .meta({ id: 'LessonStudySlot' })

const NextArtLevelSchema = z.object({
  level: BuildingLevelSchema,
  cost: ResourceAmountsSchema,
  durationSeconds: DurationSecondsSchema,
  requiredLibraryLevel: BuildingLevelSchema,
  ratePercent: QuantitySchema,
})

const ArtStateSchema = z.object({
  level: WholeCountSchema,
  resource: ResourceKindSchema,
  ratePercent: QuantitySchema,
  nextLevel: NextArtLevelSchema.nullable(),
})

const WaitingUpgradeSchema = z.object({
  building: BuildingKindSchema,
  targetLevel: BuildingLevelSchema,
  startsAt: InstantSchema,
  finishesAt: InstantSchema,
})

const SeasonStateSchema = z.strictObject({
  kind: SeasonKindSchema,
  year: WholeCountSchema.positive(),
  endsAt: InstantSchema,
  multiplierPercent: z
    .record(ResourceKindSchema, WholeCountSchema.positive())
    .meta({ required: ResourceKindSchema.options }),
  durationPercent: SeasonDurationPercentSchema,
})

const RecruitOrderStateSchema = z.strictObject({
  unit: UnitKindSchema,
  count: WholeCountSchema.positive(),
  delivered: WholeCountSchema,
  perUnitSeconds: DurationSecondsSchema.positive(),
  startedAt: InstantSchema,
  endsAt: InstantSchema,
})

const RecruitTermsSchema = z.strictObject({
  cost: ResourceAmountsSchema,
  peasants: WholeCountSchema,
  perUnitSeconds: DurationSecondsSchema.positive(),
})

const MarchOnTheRoadSchema = z.strictObject({
  province: WholeCountSchema.positive(),
  plot: WholeCountSchema.positive(),
  terrain: TerrainSchema,
  units: PartySchema,
  departedAt: InstantSchema,
  oneWaySeconds: DurationSecondsSchema.positive(),
  loot: ResourceAmountsSchema,
  arrivesAt: InstantSchema,
  leavesAt: InstantSchema,
  returnsAt: InstantSchema,
  recalledAt: InstantSchema.nullable(),
})

const ForageMarchSchema = MarchOnTheRoadSchema.extend({
  order: z.literal('forage'),
  stayHours: WholeCountSchema.positive(),
  camp: z.null(),
  fought: z.literal(false),
}).meta({ id: 'ForageMarch' })

const AttackedCampSchema = z.strictObject({
  tier: CampTierSchema,
  strength: WholeCountSchema,
})

const AttackMarchSchema = MarchOnTheRoadSchema.extend({
  order: z.literal('attack'),
  stayHours: WholeCountSchema.max(0),
  camp: AttackedCampSchema,
  fought: z.boolean(),
}).meta({ id: 'AttackMarch' })

const FoundingMarchSchema = MarchOnTheRoadSchema.extend({
  order: z.literal('found'),
  name: z.string().min(1),
  stayHours: WholeCountSchema.max(0),
  camp: z.null(),
  fought: z.literal(false),
}).meta({ id: 'FoundingMarch' })

const TransportMarchSchema = MarchOnTheRoadSchema.extend({
  order: z.literal('transport'),
  toFiefId: z.uuid(),
  cargo: ResourceAmountsSchema,
  stayHours: WholeCountSchema.max(0),
  camp: z.null(),
  fought: z.literal(false),
}).meta({ id: 'TransportMarch' })

const MarchStateSchema = z
  .discriminatedUnion('order', [
    ForageMarchSchema,
    AttackMarchSchema,
    FoundingMarchSchema,
    TransportMarchSchema,
  ])
  .meta({ id: 'MarchState' })

const IncomingCargoSchema = z.strictObject({
  fromFiefId: z.uuid(),
  from: z.strictObject({
    name: z.string().min(1),
    province: WholeCountSchema.positive(),
    plot: WholeCountSchema.positive(),
  }),
  cargo: ResourceAmountsSchema,
  departedAt: InstantSchema,
  arrivesAt: InstantSchema,
})

const UnitStatsSchema = z.strictObject({
  strength: WholeCountSchema,
  carry: WholeCountSchema,
  roadPercent: WholeCountSchema.positive(),
  barracksLevel: WholeCountSchema.positive(),
})

const CombatTermsSchema = z.strictObject({
  lootPerStrength: WholeCountSchema.positive(),
  tiers: CampTiersSchema,
})

const GoalPlacementSchema = z.strictObject({
  position: WholeCountSchema.positive(),
  count: WholeCountSchema.positive(),
  building: BuildingKindSchema,
  level: BuildingLevelSchema,
})

const ResourceShortfallSchema = z.strictObject({
  resource: ResourceKindSchema,
  amount: QuantitySchema.positive(),
})

const PendingGoalSchema = GoalPlacementSchema.extend({
  state: z.literal('pending'),
  missing: z.strictObject({
    resources: z.array(ResourceShortfallSchema),
    peasants: WholeCountSchema,
  }),
}).meta({ id: 'PendingGoal' })

const UnderwayGoalSchema = GoalPlacementSchema.extend({
  state: z.literal('underway'),
  missing: z.null(),
}).meta({ id: 'UnderwayGoal' })

const BuildSlotSchema = z
  .discriminatedUnion('kind', [IdleBuildSlotSchema, BusyBuildSlotSchema])
  .meta({ id: 'BuildSlot' })

const StudySlotSchema = z
  .discriminatedUnion('kind', [IdleStudySlotSchema, BusyStudySlotSchema, LessonStudySlotSchema])
  .meta({ id: 'StudySlot' })

const LessonStateSchema = z.strictObject({
  id: z.string().min(1),
  theme: z.string().min(1),
  durationSeconds: DurationSecondsSchema.positive(),
  requiredLibraryLevel: BuildingLevelSchema,
  skill: z.strictObject({
    resource: ResourceKindSchema,
    ratePercent: WholeCountSchema.positive(),
  }),
  isStudied: z.boolean(),
  words: z.array(
    z.strictObject({
      wordId: z.string().min(1),
      isRetained: z.boolean(),
    }),
  ),
})

const ReviewedWordSchema = z.strictObject({
  wordId: z.string().min(1),
  lessonId: z.string().min(1),
  dueAt: InstantSchema,
})

const RecognitionReviewSchema = ReviewedWordSchema.extend({
  mode: z.literal('recognition'),
  word: z.string().min(1),
  frame: z.string().min(1),
  choices: z.array(
    z.strictObject({
      wordId: z.string().min(1),
      gloss: z.string().min(1),
    }),
  ),
}).meta({ id: 'RecognitionReview' })

const RecallReviewSchema = ReviewedWordSchema.extend({
  mode: z.literal('recall'),
  gloss: z.string().min(1),
  gappedFrame: z.string().min(1),
}).meta({ id: 'RecallReview' })

const DueReviewSchema = z
  .discriminatedUnion('mode', [RecognitionReviewSchema, RecallReviewSchema])
  .meta({ id: 'DueReview' })

const GoalSchema = z
  .discriminatedUnion('state', [PendingGoalSchema, UnderwayGoalSchema])
  .meta({ id: 'Goal' })

export const FiefOverviewSchema = z
  .object({
    id: z.uuid(),
    name: z.string().min(1),
    coordinates: z.object({
      kingdom: z.number().int().positive(),
      province: z.number().int().positive(),
      plot: z.number().int().positive(),
    }),
    terrain: TerrainSchema,
    resources: z.object({
      wood: ResourceStateSchema,
      stone: ResourceStateSchema,
      iron: ResourceStateSchema,
      gold: ResourceStateSchema,
      food: ResourceStateSchema,
    }),
    buildings: z
      .record(BuildingKindSchema, BuildingStateSchema)
      .meta({ required: BuildingKindSchema.options }),
    peasants: z.object({
      supplied: WholeCountSchema,
      occupied: WholeCountSchema,
      free: WholeCountSchema,
      projectedSupplied: WholeCountSchema,
      projectedOccupied: WholeCountSchema,
      projectedFree: WholeCountSchema,
      lowestFree: WholeCountSchema,
    }),
    slot: BuildSlotSchema,
    queue: z.object({
      entries: z.array(WaitingUpgradeSchema),
      cap: WholeCountSchema,
    }),
    study: StudySlotSchema,
    arts: z.record(ArtKindSchema, ArtStateSchema).meta({ required: ArtKindSchema.options }),
    season: SeasonStateSchema.nullable(),
    units: UnitCountsSchema,
    recruitOrder: RecruitOrderStateSchema.nullable(),
    recruitTerms: z
      .record(UnitKindSchema, RecruitTermsSchema)
      .meta({ required: UnitKindSchema.options }),
    unitTerms: z.record(UnitKindSchema, UnitStatsSchema).meta({ required: UnitKindSchema.options }),
    march: z.lazy(() => MarchStateSchema).nullable(),
    forageTerms: ForageTermsSchema,
    combatTerms: CombatTermsSchema,
    incomingCargo: IncomingCargoSchema.nullable(),
    goal: z.lazy(() => GoalSchema).nullable(),
    lessons: z.array(LessonStateSchema),
    skills: z.array(EarnedSkillSchema),
    reviews: z.strictObject({
      due: z.array(DueReviewSchema),
      nextDueAt: InstantSchema.nullable(),
    }),
    readAt: InstantSchema,
  })
  .meta({ id: 'FiefOverview' })

export type FiefOverview = z.infer<typeof FiefOverviewSchema>
