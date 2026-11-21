import type { TownOverview } from '@mygame/contracts'
import {
  type DomainError,
  Duration,
  type Instant,
  ok,
  type Result,
  type Town,
  type TownCatalog,
  type WaitingList,
} from '@mygame/domain'
import { isoOf } from '#platform/infrastructure/http/isoOf'

type BuildingWork = TownOverview['work']['waitingList'][number]

const scheduledWaitingListOf = (
  slotFinishesAt: Instant,
  waitingList: WaitingList,
): Result<Array<BuildingWork>, DomainError> => {
  const scheduled: Array<BuildingWork> = []
  let startsAt = slotFinishesAt
  for (const { building, level, cost, durationSeconds } of waitingList) {
    const duration = Duration.ofSeconds(durationSeconds)
    if (!duration.ok) {
      return duration
    }
    const finishesAt = startsAt.plus(duration.value)
    scheduled.push({
      building,
      level,
      cost: { ...cost },
      startsAt: isoOf(startsAt),
      finishesAt: isoOf(finishesAt),
    })
    startsAt = finishesAt
  }
  return ok(scheduled)
}

export const presentTownWork = (
  town: Town,
  catalog: TownCatalog,
): Result<TownOverview['work'], DomainError> => {
  const cap = catalog.townSettings().waitingListCap
  const slot = town.workSlot
  if (slot.kind === 'idle') {
    return ok({ slot: null, waitingList: [], cap })
  }
  const { building, level, cost, startedAt, finishesAt } = slot
  const waitingList = scheduledWaitingListOf(finishesAt, town.waitingList)
  if (!waitingList.ok) {
    return waitingList
  }
  return ok({
    slot: {
      building,
      level,
      cost: { ...cost },
      startsAt: isoOf(startedAt),
      finishesAt: isoOf(finishesAt),
    },
    waitingList: waitingList.value,
    cap,
  })
}
