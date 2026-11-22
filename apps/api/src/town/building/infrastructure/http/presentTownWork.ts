import type { TownOverview } from '@mygame/contracts'
import {
  type BusyWorkSlot,
  type DomainError,
  ok,
  type Result,
  type Town,
  type TownCatalog,
  waitingListScheduleOf,
} from '@mygame/domain'
import { isoOf } from '#platform/infrastructure/http/isoOf'

type BuildingWork = TownOverview['work']['waitingList'][number]

const buildingWorkOf = ({
  building,
  level,
  cost,
  startedAt,
  finishesAt,
}: BusyWorkSlot): BuildingWork => ({
  building,
  level,
  cost: { ...cost },
  startsAt: isoOf(startedAt),
  finishesAt: isoOf(finishesAt),
})

export const presentTownWork = (
  town: Town,
  catalog: TownCatalog,
): Result<TownOverview['work'], DomainError> => {
  const cap = catalog.townSettings().waitingListCap
  const slot = town.workSlot
  if (slot.kind === 'idle') {
    return ok({ slot: null, waitingList: [], cap })
  }
  const schedule = waitingListScheduleOf(slot, town.waitingList)
  if (!schedule.ok) {
    return schedule
  }
  return ok({ slot: buildingWorkOf(slot), waitingList: schedule.value.map(buildingWorkOf), cap })
}
