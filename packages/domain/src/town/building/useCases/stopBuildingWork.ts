import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import type { Clock } from '#ports/Clock'
import { ok, type Result } from '#Result'
import type { TownCatalog } from '../../ports/TownCatalog'
import type { TownNews } from '../../ports/TownNews'
import type { TownRepository } from '../../ports/TownRepository'
import { accrueTown } from '../../resources/accrueTown'
import { rebaseFullSince } from '../../resources/rebaseFullSince'
import { resolveStoredTown } from '../../services/resolveStoredTown'
import { saveChangedTown } from '../../services/saveChangedTown'
import type { ChangedTown } from '../../Town'
import type { WorkTarget } from '../BuildingWork'

export type StopBuildingWorkCommand = WorkTarget & {
  readonly playerId: PlayerId
}

export type StopBuildingWorkDependencies = {
  readonly towns: TownRepository
  readonly news: TownNews
  readonly catalog: TownCatalog
  readonly clock: Clock
}

export const stopBuildingWork = async (
  { playerId, building, level }: StopBuildingWorkCommand,
  { towns, news, catalog, clock }: StopBuildingWorkDependencies,
): Promise<Result<ChangedTown, DomainError>> => {
  const now = clock.now()
  const resolved = await resolveStoredTown(playerId, towns, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const town = resolved.value.town
  const accrual = accrueTown(town, catalog, now)
  if (!accrual.ok) {
    return accrual
  }
  const stopped = town.buildingWork.stop({ building, level }, accrual.value.stocks, now, catalog)
  if (!stopped.ok) {
    return stopped
  }
  const rebased = rebaseFullSince(
    accrual.value.fullSince,
    town.changedBy(stopped.value.state),
    catalog,
  )
  if (!rebased.ok) {
    return rebased
  }
  const change = {
    town: rebased.value,
    events: [...resolved.value.events, ...stopped.value.events],
  }
  const saved = await saveChangedTown(change, towns, news)
  if (!saved.ok) {
    return saved
  }
  return ok(change)
}
