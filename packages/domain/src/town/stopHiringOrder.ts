import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type { Clock } from '../ports/Clock'
import { ok, type Result } from '../Result'
import { accrueTown } from './accrueTown'
import type { HiringTarget } from './HiringOrder'
import { rebaseFullSince } from './rebaseFullSince'
import { resolvedTownOf } from './resolvedTownOf'
import { saveChangedTown } from './saveChangedTown'
import type { ChangedTown } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownNews } from './TownNews'
import type { TownRepository } from './TownRepository'

export type StopHiringOrderCommand = HiringTarget & {
  readonly playerId: PlayerId
}

export type StopHiringOrderDependencies = {
  readonly towns: TownRepository
  readonly news: TownNews
  readonly catalog: TownCatalog
  readonly clock: Clock
}

export const stopHiringOrder = async (
  { playerId, hire, startedAt }: StopHiringOrderCommand,
  { towns, news, catalog, clock }: StopHiringOrderDependencies,
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
  const stopped = town.stopHiring({ hire, startedAt }, accrual.value.stocks, now)
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
