import { z } from 'zod'

export const HoldoutCheckWeekSchema = z
  .enum({ eight: 8, twentyFour: 24 })
  .meta({ id: 'HoldoutCheckWeek' })

export type HoldoutCheckWeek = z.infer<typeof HoldoutCheckWeekSchema>
