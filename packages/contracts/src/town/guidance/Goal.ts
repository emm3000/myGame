import { z } from 'zod'
import { BuildingLevelSchema, WholeCountSchema } from '../../platform/Wire'
import { BuildingKindSchema } from '../building/BuildingKind'
import { ResourceAmountsSchema } from '../ResourceAmounts'

const goalPlacement = {
  position: WholeCountSchema.positive(),
  count: WholeCountSchema.positive(),
  building: BuildingKindSchema,
  level: BuildingLevelSchema,
}

const PendingGoalSchema = z
  .strictObject({
    ...goalPlacement,
    state: z.literal('pending'),
    missing: z.strictObject({
      resources: ResourceAmountsSchema,
      people: WholeCountSchema,
    }),
  })
  .meta({ id: 'PendingGoal' })

const UnderwayGoalSchema = z
  .strictObject({
    ...goalPlacement,
    state: z.literal('underway'),
  })
  .meta({ id: 'UnderwayGoal' })

export const GoalSchema = z
  .discriminatedUnion('state', [PendingGoalSchema, UnderwayGoalSchema])
  .meta({ id: 'Goal' })

export type Goal = z.infer<typeof GoalSchema>
