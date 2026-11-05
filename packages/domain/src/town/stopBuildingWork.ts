import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type { Clock } from '../ports/Clock'
import { ok, type Result } from '../Result'
import { accrueTown } from './accrueTown'
import type { WorkTarget } from './BuildingWork'
import { rebaseFullSince } from './rebaseFullSince'
import { resolvedTownOf } from './resolvedTownOf'
import { saveChangedTown } from './saveChangedTown'
import type { ChangedTown } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownNews } from './TownNews'
import type { TownRepository } from './TownRepository'

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
  const resolved = await resolvedTownOf(playerId, towns, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const town = resolved.value.town
  const accrual = accrueTown(town, catalog, now)
  if (!accrual.ok) {
    return accrual
  }
  const stopped = town.stopWork({ building, level }, accrual.value.stocks, now, catalog)
  if (!stopped.ok) {
    return stopped
  }
  const rebased = rebaseFullSince(accrual.value.fullSince, stopped.value.town, catalog)
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
