import { z } from 'zod'
import { BuildingKindSchema } from './BuildingKind'
import { TerrainSchema } from './Terrain'
import { InstantSchema, QuantitySchema, WholeCountSchema } from './Wire'

const ResourceStateSchema = z.object({
  amount: QuantitySchema,
  ratePerHour: QuantitySchema,
  capacity: WholeCountSchema,
})

const IdleSlotSchema = z.object({
  state: z.literal('idle'),
})

const BusySlotSchema = z.object({
  state: z.literal('busy'),
  building: BuildingKindSchema,
  targetLevel: z.number().int().positive(),
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
  buildings: z.array(
    z.object({
      building: BuildingKindSchema,
      level: WholeCountSchema,
    }),
  ),
  peasants: z.object({
    supplied: WholeCountSchema,
    occupied: WholeCountSchema,
    free: WholeCountSchema,
  }),
  slot: z.discriminatedUnion('state', [IdleSlotSchema, BusySlotSchema]),
  readAt: InstantSchema,
})

export type FiefOverview = z.infer<typeof FiefOverviewSchema>
