import { z } from 'zod'
import { ArtKindSchema } from './ArtKind'
import { BuildingKindSchema } from './BuildingKind'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { ResourceKindSchema } from './ResourceKind'
import { SeasonDurationPercentSchema } from './SeasonDurationPercent'
import { SeasonKindSchema } from './SeasonKind'
import { TerrainSchema } from './Terrain'
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

export const FiefOverviewSchema = z.object({
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
  }),
  slot: z.discriminatedUnion('kind', [IdleSlotSchema, BusySlotSchema]),
  queue: z.object({
    entries: z.array(WaitingUpgradeSchema),
    cap: WholeCountSchema,
  }),
  study: z.discriminatedUnion('kind', [IdleStudySchema, BusyStudySchema]),
  arts: z.record(ArtKindSchema, ArtStateSchema),
  season: SeasonStateSchema.nullable(),
  readAt: InstantSchema,
})

export type FiefOverview = z.infer<typeof FiefOverviewSchema>
