import { z } from 'zod'
import { BuildingKindSchema } from './BuildingKind'
import { ResourceAmountsSchema } from './ResourceAmounts'
import { BuildingLevelSchema, WholeCountSchema } from './Wire'

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
