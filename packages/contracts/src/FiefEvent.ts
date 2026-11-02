import { z } from 'zod'
import { ArtKindSchema } from './ArtKind'
import { BuildingKindSchema } from './BuildingKind'
import { PartySchema } from './Party'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { UnitCountsSchema } from './UnitCounts'
import { UnitKindSchema } from './UnitKind'
import { BuildingLevelSchema, CampTierSchema, InstantSchema, WholeCountSchema } from './Wire'

const UpgradeFinishedSchema = z
  .strictObject({
    kind: z.literal('upgradeFinished'),
    building: BuildingKindSchema,
    level: BuildingLevelSchema,
    occurredAt: InstantSchema,
  })
  .meta({ id: 'UpgradeFinishedEvent' })

const ArtLearnedSchema = z
  .strictObject({
    kind: z.literal('artLearned'),
    art: ArtKindSchema,
    level: BuildingLevelSchema,
    occurredAt: InstantSchema,
  })
  .meta({ id: 'ArtLearnedEvent' })

const UpgradeCancelledSchema = z
  .strictObject({
    kind: z.literal('upgradeCancelled'),
    building: BuildingKindSchema,
    level: BuildingLevelSchema,
    occurredAt: InstantSchema,
    refund: ResourceAmountsSchema,
  })
  .meta({ id: 'UpgradeCancelledEvent' })

const StudyCancelledSchema = z
  .strictObject({
    kind: z.literal('studyCancelled'),
    art: ArtKindSchema,
    level: BuildingLevelSchema,
    occurredAt: InstantSchema,
    refund: ResourceAmountsSchema,
  })
  .meta({ id: 'StudyCancelledEvent' })

const RecruitsDeliveredSchema = z
  .strictObject({
    kind: z.literal('recruitsDelivered'),
    unit: UnitKindSchema,
    count: WholeCountSchema.positive(),
    occurredAt: InstantSchema,
  })
  .meta({ id: 'RecruitsDeliveredEvent' })

const RecruitsCancelledSchema = z
  .strictObject({
    kind: z.literal('recruitsCancelled'),
    unit: UnitKindSchema,
    delivered: WholeCountSchema,
    cancelled: WholeCountSchema.positive(),
    occurredAt: InstantSchema,
    refund: ResourceAmountsSchema,
  })
  .meta({ id: 'RecruitsCancelledEvent' })

const MarchReturnedSchema = z
  .strictObject({
    kind: z.literal('marchReturned'),
    province: WholeCountSchema.positive(),
    plot: WholeCountSchema.positive(),
    units: PartySchema,
    loot: ResourceAmountsSchema,
    occurredAt: InstantSchema,
    recalled: z.boolean(),
  })
  .meta({ id: 'MarchReturnedEvent' })

const BattleFoughtSchema = z
  .strictObject({
    kind: z.literal('battleFought'),
    province: WholeCountSchema.positive(),
    plot: WholeCountSchema.positive(),
    tier: CampTierSchema,
    won: z.boolean(),
    unitsLost: UnitCountsSchema,
    campLost: WholeCountSchema,
    occurredAt: InstantSchema,
  })
  .meta({ id: 'BattleFoughtEvent' })

const FoundingSentSchema = z
  .strictObject({
    kind: z.literal('foundingSent'),
    province: WholeCountSchema.positive(),
    plot: WholeCountSchema.positive(),
    name: z.string().min(1),
    occurredAt: InstantSchema,
  })
  .meta({ id: 'FoundingSentEvent' })

const FiefFoundedSchema = z
  .strictObject({
    kind: z.literal('fiefFounded'),
    province: WholeCountSchema.positive(),
    plot: WholeCountSchema.positive(),
    name: z.string().min(1),
    occurredAt: InstantSchema,
  })
  .meta({ id: 'FiefFoundedEvent' })

const TransportSentSchema = z
  .strictObject({
    kind: z.literal('transportSent'),
    province: WholeCountSchema.positive(),
    plot: WholeCountSchema.positive(),
    name: z.string().min(1),
    cargo: ResourceAmountsSchema,
    occurredAt: InstantSchema,
  })
  .meta({ id: 'TransportSentEvent' })

const TransportArrivedSchema = z
  .strictObject({
    kind: z.literal('transportArrived'),
    province: WholeCountSchema.positive(),
    plot: WholeCountSchema.positive(),
    name: z.string().min(1),
    cargo: ResourceAmountsSchema,
    occurredAt: InstantSchema,
  })
  .meta({ id: 'TransportArrivedEvent' })

export const FiefEventSchema = z
  .discriminatedUnion('kind', [
    UpgradeFinishedSchema,
    ArtLearnedSchema,
    UpgradeCancelledSchema,
    StudyCancelledSchema,
    RecruitsDeliveredSchema,
    RecruitsCancelledSchema,
    MarchReturnedSchema,
    BattleFoughtSchema,
    FoundingSentSchema,
    FiefFoundedSchema,
    TransportSentSchema,
    TransportArrivedSchema,
  ])
  .meta({ id: 'FiefEvent' })

export type FiefEvent = z.infer<typeof FiefEventSchema>
