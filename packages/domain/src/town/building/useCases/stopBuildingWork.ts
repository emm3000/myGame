import type { DomainError } from '#DomainError'
import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import { resolveStoredTown } from '../../application/resolveStoredTown'
import { saveChangedTown } from '../../application/saveChangedTown'
import type { ChangedTown } from '../../domain/Town'
import type { TownCatalog } from '../../domain/TownCatalog'
import type { TownNews } from '../../domain/TownNews'
import type { TownRepository } from '../../domain/TownRepository'
import { accrueTown } from '../../resources/accrueTown'
import { rebaseFullSince } from '../../resources/rebaseFullSince'
import type { WorkTarget } from '../domain/BuildingWork'

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
