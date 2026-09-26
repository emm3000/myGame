import { z } from 'zod'
import { BuildingKindSchema } from './BuildingKind'
import { ResourceAmountsSchema } from './ResourceAmounts'
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

const WaitingUpgradeSchema = z.object({
  building: BuildingKindSchema,
  targetLevel: BuildingLevelSchema,
  startsAt: InstantSchema,
  finishesAt: InstantSchema,
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
    projectedFree: WholeCountSchema,
  }),
  slot: z.discriminatedUnion('kind', [IdleSlotSchema, BusySlotSchema]),
  queue: z.array(WaitingUpgradeSchema),
  readAt: InstantSchema,
})

export type FiefOverview = z.infer<typeof FiefOverviewSchema>
