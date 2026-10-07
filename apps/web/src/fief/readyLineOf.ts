import { type FiefOverview, ResourceKindSchema } from '@mygame/contracts'
import { copy } from '../copy'
import { formatClock } from '../time/formatClock'
import { formatTimeLeft } from '../time/formatTimeLeft'
import { amountAfter, type LiveFief } from './liveFief'
import { type ResourceCost, shortfallOf } from './shortfallsOf'

const secondsPerHour = 3600
const secondsPerMinute = 60
const millisecondsPerMinute = 60_000

type ResourceState = FiefOverview['resources']['wood']

function readySecondsOf(cost: number, resource: ResourceState): number | undefined {
  if (resource.ratePerHour <= 0 || cost > resource.capacity) {
    return undefined
  }
  const minutes = Math.ceil(
    ((cost - resource.amount) * secondsPerHour) / resource.ratePerHour / secondsPerMinute,
  )
  const isReached = Math.floor(amountAfter(resource, minutes * secondsPerMinute)) >= cost
  return (isReached ? minutes : minutes + 1) * secondsPerMinute
}

function latestReadySecondsOf(cost: ResourceCost, fief: LiveFief): number | undefined {
  const shortResources = ResourceKindSchema.options.filter(
    (resource) => shortfallOf(cost[resource], fief.amounts[resource]) > 0,
  )
  let latest = 0
  for (const resource of shortResources) {
    const seconds = readySecondsOf(cost[resource], fief.overview.resources[resource])
    if (seconds === undefined) {
      return undefined
    }
    latest = Math.max(latest, seconds)
  }
  return latest
}

export function readyLineOf(cost: ResourceCost, fief: LiveFief): string | undefined {
  const readySeconds = latestReadySecondsOf(cost, fief)
  if (readySeconds === undefined) {
    return undefined
  }
  const ready = new Date(Date.parse(fief.overview.readAt) + readySeconds * 1000)
  const remainingSeconds = (ready.getTime() - fief.at.getTime()) / 1000
  if (Math.ceil(remainingSeconds) <= secondsPerHour) {
    return copy.status.readyIn(formatTimeLeft(Math.max(secondsPerMinute, remainingSeconds)))
  }
  const readyMinute = new Date(
    Math.ceil(ready.getTime() / millisecondsPerMinute) * millisecondsPerMinute,
  )
  return copy.status.readyAt(formatClock(readyMinute, fief.at))
}
