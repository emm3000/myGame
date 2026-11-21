import { type Hires, type HiringSlot, Instant, idleHiringSlot } from '@mygame/domain'
import { z } from 'zod'
import { townHire } from './hiringTables'
import { stocksFromRow } from './stocksFromRow'
import type { towns } from './townTables'

type TownRow = typeof towns.$inferSelect

const AggregatedHiresSchema = z.array(
  z.strictObject({ hire: z.enum(townHire.enumValues), count: z.number().int() }),
)

const AggregatedHiringOrdersSchema = z
  .array(
    z.strictObject({
      hire: z.enum(townHire.enumValues),
      count: z.number().int(),
      costMoney: z.number(),
      costFood: z.number(),
      costPower: z.number(),
      costMaterial: z.number(),
      secondsPerHire: z.number().int(),
      startedAt: z.string(),
    }),
  )
  .max(1)

export const hiresFromRow = (row: TownRow, aggregate: unknown): Hires => {
  const counts = new Map(
    AggregatedHiresSchema.parse(aggregate).map(({ hire, count }) => [hire, count]),
  )
  const worker = counts.get('worker')
  const truck = counts.get('truck')
  if (worker === undefined || truck === undefined) {
    throw new Error(`Town ${row.id} stores no count for every hire`)
  }
  return { worker, truck }
}

export const hiringSlotFromRow = (aggregate: unknown): HiringSlot => {
  const [order] = AggregatedHiringOrdersSchema.parse(aggregate)
  if (order === undefined) {
    return idleHiringSlot
  }
  return {
    kind: 'busy',
    hire: order.hire,
    count: order.count,
    costPerHire: stocksFromRow(
      order.costMoney,
      order.costFood,
      order.costPower,
      order.costMaterial,
    ),
    secondsPerHire: order.secondsPerHire,
    startedAt: Instant.fromEpochMilliseconds(Date.parse(order.startedAt)),
  }
}
