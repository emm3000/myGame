import { es, townReadyAt, townReadyIn } from '@mygame/catalog'
import { type ResourceAmounts, ResourceKindSchema } from '@mygame/contracts'
import { Instant, readyMinuteOf } from '@mygame/domain'
import type { Label } from '../design-system/Label'
import { lineLabelOf } from '../design-system/lineLabelOf'
import { formatClock } from '../time/formatClock'
import { formatTimeLeft } from '../time/formatTimeLeft'
import type { LiveTown } from './liveTown'

const secondsPerHour = 3600

export function readyLineOf(cost: ResourceAmounts, town: LiveTown): Label | undefined {
  const { stocks, readAt } = town.overview
  const needs = ResourceKindSchema.options.map((resource) => ({
    stock: stocks[resource],
    cost: cost[resource],
  }))
  const ready = readyMinuteOf(needs, Instant.fromEpochMilliseconds(Date.parse(readAt)))
  if (ready === null) {
    return undefined
  }
  const remainingSeconds = (ready.epochMilliseconds - town.at.getTime()) / 1000
  const line =
    Math.ceil(remainingSeconds) < secondsPerHour
      ? townReadyIn({ time: formatTimeLeft(remainingSeconds) })
      : townReadyAt({ time: formatClock(es, new Date(ready.epochMilliseconds), town.at) })
  return lineLabelOf(line, 'es')
}
