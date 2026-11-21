import { type ResourceAmounts, ResourceKindSchema } from '@mygame/contracts'
import { Instant, readyMinuteOf } from '@mygame/domain'
import type { PlayerCopy } from '../copy/PlayerCopy'
import type { Label } from '../design-system/Label'
import { formatClock } from '../time/formatClock'
import { formatTimeLeft } from '../time/formatTimeLeft'
import type { LiveTown } from './liveTown'

const secondsPerHour = 3600

export function readyLineOf(
  copy: PlayerCopy,
  cost: ResourceAmounts,
  town: LiveTown,
): Label | undefined {
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
  const readyAt = new Date(ready.epochMilliseconds)
  return copy.chrome((catalog) =>
    Math.ceil(remainingSeconds) < secondsPerHour
      ? catalog.townReadyIn({ time: formatTimeLeft(remainingSeconds) })
      : catalog.townReadyAt({ time: formatClock(catalog, readyAt, town.at) }),
  )
}
