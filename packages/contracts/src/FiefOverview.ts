import { z } from 'zod'
import { ArtKindSchema } from './ArtKind'
import { BuildingKindSchema } from './BuildingKind'
import { CampTiersSchema } from './CampTiers'
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

const IdleSlotSchema = z.object({
  kind: z.literal('idle'),
})

const BusySlotSchema = z.object({
  kind: z.literal('busy'),
  building: BuildingKindSchema,
  targetLevel: BuildingLevelSchema,
  startedAt: InstantSchema,
  finishesAt: InstantSchema,
})

const IdleStudySchema = z.object({
  kind: z.literal('idle'),
})

const BusyStudySchema = z.object({
  kind: z.literal('busy'),
  art: ArtKindSchema,
  targetLevel: BuildingLevelSchema,
  startedAt: InstantSchema,
  finishesAt: InstantSchema,
})

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
  multiplierPercent: z.record(ResourceKindSchema, WholeCountSchema.positive()),
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

const ForageMarchStateSchema = MarchOnTheRoadSchema.extend({
  order: z.literal('forage'),
  stayHours: WholeCountSchema.positive(),
  camp: z.null(),
  fought: z.literal(false),
})

const AttackedCampSchema = z.strictObject({
  tier: z.literal([1, 2, 3]),
  strength: WholeCountSchema,
})

const AttackMarchStateSchema = MarchOnTheRoadSchema.extend({
  order: z.literal('attack'),
  stayHours: z.literal(0),
  camp: AttackedCampSchema,
  fought: z.boolean(),
})

const FoundingMarchStateSchema = MarchOnTheRoadSchema.extend({
  order: z.literal('found'),
  name: z.string().min(1),
  stayHours: z.literal(0),
  camp: z.null(),
  fought: z.literal(false),
})

const TransportMarchStateSchema = MarchOnTheRoadSchema.extend({
  order: z.literal('transport'),
  toFiefId: z.uuid(),
  cargo: ResourceAmountsSchema,
  stayHours: z.literal(0),
  camp: z.null(),
  fought: z.literal(false),
})

const MarchStateSchema = z.discriminatedUnion('order', [
  ForageMarchStateSchema,
  AttackMarchStateSchema,
  FoundingMarchStateSchema,
  TransportMarchStateSchema,
])

const IncomingCargoSchema = z.strictObject({
  fromFiefId: z.uuid(),
  from: z.strictObject({
    name: z.string().min(1),
    province: WholeCountSchema.positive(),
    plot: WholeCountSchema.positive(),
  }),
  cargo: ResourceAmountsSchema,
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
})

const UnderwayGoalSchema = GoalPlacementSchema.extend({
  state: z.literal('underway'),
  missing: z.null(),
})

const GoalSchema = z.discriminatedUnion('state', [PendingGoalSchema, UnderwayGoalSchema])

export const FiefOverviewSchema = z.object({
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
  buildings: z.record(BuildingKindSchema, BuildingStateSchema),
  peasants: z.object({
    supplied: WholeCountSchema,
    occupied: WholeCountSchema,
    free: WholeCountSchema,
    projectedSupplied: WholeCountSchema,
    projectedOccupied: WholeCountSchema,
    projectedFree: WholeCountSchema,
    lowestFree: WholeCountSchema,
  }),
  slot: z.discriminatedUnion('kind', [IdleSlotSchema, BusySlotSchema]),
  queue: z.object({
    entries: z.array(WaitingUpgradeSchema),
    cap: WholeCountSchema,
  }),
  study: z.discriminatedUnion('kind', [IdleStudySchema, BusyStudySchema]),
  arts: z.record(ArtKindSchema, ArtStateSchema),
  season: SeasonStateSchema.nullable(),
  units: UnitCountsSchema,
  recruitOrder: RecruitOrderStateSchema.nullable(),
  recruitTerms: z.record(UnitKindSchema, RecruitTermsSchema),
  unitTerms: z.record(UnitKindSchema, UnitStatsSchema),
  march: MarchStateSchema.nullable(),
  forageTerms: ForageTermsSchema,
  combatTerms: CombatTermsSchema,
  incomingCargo: IncomingCargoSchema.nullable(),
  goal: GoalSchema.nullable(),
  readAt: InstantSchema,
})

export type FiefOverview = z.infer<typeof FiefOverviewSchema>
