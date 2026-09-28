import { z } from 'zod'
import { ArtKindSchema } from './ArtKind'
import { BuildingKindSchema } from './BuildingKind'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { BuildingLevelSchema, InstantSchema } from './Wire'

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

export const FiefEventSchema = z.discriminatedUnion('kind', [
  UpgradeFinishedSchema,
  ArtLearnedSchema,
  UpgradeCancelledSchema,
  StudyCancelledSchema,
])

export type FiefEvent = z.infer<typeof FiefEventSchema>
