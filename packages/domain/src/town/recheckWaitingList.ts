import type { DomainError } from '../DomainError'
import { ok, type Result } from '../Result'
import type { BuildingLevels } from './BuildingLevels'
import type { WaitingList, WaitingWork, WorkSlot } from './BuildingWork'
import { derivePeople } from './derivePeople'
import type { Hires } from './Hires'
import type { TownCatalog } from './TownCatalog'

export type RecheckedWaitingList = {
  readonly kept: WaitingList
  readonly stopped: WaitingList
}

const fitsProjection = (
  projected: BuildingLevels,
  hires: Hires,
  work: WaitingWork,
  catalog: TownCatalog,
): Result<boolean, DomainError> => {
  if (work.level !== projected[work.building] + 1) {
    return ok(false)
  }
  const people = derivePeople({ ...projected, [work.building]: work.level }, hires, catalog)
  if (!people.ok) {
    return people
  }
  return ok(people.value.free >= 0)
}

export const recheckWaitingList = (
  buildingLevels: BuildingLevels,
  workSlot: WorkSlot,
  waitingList: WaitingList,
  hires: Hires,
  catalog: TownCatalog,
): Result<RecheckedWaitingList, DomainError> => {
  const projected = { ...buildingLevels }
  if (workSlot.kind === 'busy') {
    projected[workSlot.building] = workSlot.level
  }
  const kept: Array<WaitingWork> = []
  const stopped: Array<WaitingWork> = []
  for (const work of waitingList) {
    const fits = fitsProjection(projected, hires, work, catalog)
    if (!fits.ok) {
      return fits
    }
    if (fits.value) {
      projected[work.building] = work.level
      kept.push(work)
    } else {
      stopped.push(work)
    }
  }
  return ok({ kept, stopped })
}
