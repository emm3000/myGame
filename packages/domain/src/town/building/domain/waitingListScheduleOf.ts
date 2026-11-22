import type { DomainError } from '#DomainError'
import { ok, type Result } from '#Result'
import type { BusyWorkSlot } from './BuildingWork'
import { busySlotOf } from './busySlotOf'
import type { WaitingList } from './WaitingList'

export const waitingListScheduleOf = (
  slot: BusyWorkSlot,
  waitingList: WaitingList,
): Result<ReadonlyArray<BusyWorkSlot>, DomainError> => {
  const schedule: Array<BusyWorkSlot> = []
  let startsAt = slot.finishesAt
  for (const work of waitingList) {
    const scheduled = busySlotOf(work, startsAt)
    if (!scheduled.ok) {
      return scheduled
    }
    schedule.push(scheduled.value)
    startsAt = scheduled.value.finishesAt
  }
  return ok(schedule)
}
