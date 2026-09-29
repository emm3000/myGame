import { z } from 'zod'
import { ArtKindSchema } from './ArtKind'
import { BuildingKindSchema } from './BuildingKind'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { UnitKindSchema } from './UnitKind'
import { BuildingLevelSchema, InstantSchema, WholeCountSchema } from './Wire'

const UpgradeFinishedSchema = z.strictObject({
  kind: z.literal('upgradeFinished'),
  building: BuildingKindSchema,
  level: BuildingLevelSchema,
  occurredAt: InstantSchema,
})

const ArtLearnedSchema = z.strictObject({
  kind: z.literal('artLearned'),
  art: ArtKindSchema,
  level: BuildingLevelSchema,
  occurredAt: InstantSchema,
})

const UpgradeCancelledSchema = z.strictObject({
  kind: z.literal('upgradeCancelled'),
  building: BuildingKindSchema,
  level: BuildingLevelSchema,
  occurredAt: InstantSchema,
  refund: ResourceAmountsSchema,
})

const StudyCancelledSchema = z.strictObject({
  kind: z.literal('studyCancelled'),
  art: ArtKindSchema,
  level: BuildingLevelSchema,
  occurredAt: InstantSchema,
  refund: ResourceAmountsSchema,
})

const RecruitsDeliveredSchema = z.strictObject({
  kind: z.literal('recruitsDelivered'),
  unit: UnitKindSchema,
  count: WholeCountSchema.positive(),
  occurredAt: InstantSchema,
})

export const FiefEventSchema = z.discriminatedUnion('kind', [
  UpgradeFinishedSchema,
  ArtLearnedSchema,
  UpgradeCancelledSchema,
  StudyCancelledSchema,
  RecruitsDeliveredSchema,
])

export type FiefEvent = z.infer<typeof FiefEventSchema>
