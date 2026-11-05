import { z } from 'zod'
import { EarnedSkillSchema } from '../EarnedSkill'
import { LessonStateSchema } from '../LessonState'
import { SeasonKindSchema } from '../SeasonKind'
import {
  BuildingLevelSchema,
  DurationSecondsSchema,
  InstantSchema,
  QuantitySchema,
  WholeCountSchema,
} from '../Wire'
import { BuildingKindSchema } from './BuildingKind'
import { BuildingWorkSchema } from './BuildingWork'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { ResourceKindSchema } from './ResourceKind'
import { TerrainSchema } from './Terrain'

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

const TownSeasonSchema = z.strictObject({
  kind: SeasonKindSchema,
  year: WholeCountSchema.positive(),
  endsAt: InstantSchema,
})

export const TownOverviewSchema = z
  .strictObject({
    name: z.string().min(1),
    label: z.enum(['town', 'city']),
    site: z.strictObject({
      region: WholeCountSchema.positive(),
      area: WholeCountSchema.positive(),
      site: WholeCountSchema.positive(),
    }),
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
    lessons: z.array(LessonStateSchema),
    skills: z.array(EarnedSkillSchema),
    lessonSlot: LessonUnderStudySchema.nullable(),
    readAt: InstantSchema,
  })
  .meta({ id: 'TownOverview' })

export type TownOverview = z.infer<typeof TownOverviewSchema>
