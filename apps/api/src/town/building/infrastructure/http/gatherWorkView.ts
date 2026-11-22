import {
  type BusyWorkSlot,
  type DomainError,
  ok,
  type Result,
  type Town,
  type TownCatalog,
  waitingListScheduleOf,
} from '@mygame/domain'

export type WorkView = {
  readonly slot: BusyWorkSlot | null
  readonly waitingList: ReadonlyArray<BusyWorkSlot>
  readonly cap: number
}

export const gatherWorkView = (town: Town, catalog: TownCatalog): Result<WorkView, DomainError> => {
  const cap = catalog.townSettings().waitingListCap
  const slot = town.workSlot
  if (slot.kind === 'idle') {
    return ok({ slot: null, waitingList: [], cap })
  }
  const waitingList = waitingListScheduleOf(slot, town.waitingList)
  return waitingList.ok ? ok({ slot, waitingList: waitingList.value, cap }) : waitingList
}
