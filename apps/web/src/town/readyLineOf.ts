import { type ResourceAmounts, ResourceKindSchema } from '@mygame/contracts'
import { Instant, readyMinuteOf } from '@mygame/domain'
import type { PlayerCopy } from '../copy/PlayerCopy'
import type { Label } from '../design-system/Label'
import { formatClock } from '../time/formatClock'
import { formatTimeLeft } from '../time/formatTimeLeft'
import type { LiveTown } from './liveTown'

const secondsPerHour = 3600

const readyAtOf = (cost: ResourceAmounts, { overview }: LiveTown): Instant | null =>
  readyMinuteOf(
    ResourceKindSchema.options.map((resource) => ({
      stock: overview.stocks[resource],
      cost: cost[resource],
    })),
    Instant.fromEpochMilliseconds(Date.parse(overview.readAt)),
  )

const secondsFrom = (town: LiveTown, ready: Instant): number =>
  (ready.epochMilliseconds - town.at.getTime()) / 1000

export function readySecondsOf(cost: ResourceAmounts, town: LiveTown): number | null {
  const ready = readyAtOf(cost, town)
  return ready === null ? null : secondsFrom(town, ready)
}

export function readyLineOf(
  copy: PlayerCopy,
  cost: ResourceAmounts,
  town: LiveTown,
): Label | undefined {
  const ready = readyAtOf(cost, town)
  if (ready === null) {
    return undefined
  }
  const remainingSeconds = secondsFrom(town, ready)
  const readyAt = new Date(ready.epochMilliseconds)
  return copy.chrome((catalog) =>
    Math.ceil(remainingSeconds) < secondsPerHour
      ? catalog.townReadyIn({ time: formatTimeLeft(remainingSeconds) })
      : catalog.townReadyAt({ time: formatClock(catalog, readyAt, town.at) }),
  )
}
