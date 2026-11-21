import type { DomainError } from '../../../DomainError'
import type { PlayerId } from '../../../player/PlayerId'
import type { Clock } from '../../../ports/Clock'
import { ok, type Result } from '../../../Result'
import type { Instant } from '../../../time/Instant'
import type { TownCatalog } from '../../ports/TownCatalog'
import type { TownNews } from '../../ports/TownNews'
import type { TownRepository } from '../../ports/TownRepository'
import { resolveStoredTown } from '../../services/resolveStoredTown'
import { saveChangedTown } from '../../services/saveChangedTown'
import type { Town } from '../../Town'
import type { CleanUpRepository } from '../ports/CleanUpRepository'

export type CallJobBackCommand = {
  readonly playerId: PlayerId
  readonly sentAt: Instant
}

export type CallJobBackDependencies = {
  readonly towns: TownRepository
  readonly cleanUps: CleanUpRepository
  readonly news: TownNews
  readonly catalog: TownCatalog
  readonly clock: Clock
}

export const callJobBack = async (
  { playerId, sentAt }: CallJobBackCommand,
  { towns, cleanUps, news, catalog, clock }: CallJobBackDependencies,
): Promise<Result<Town, DomainError>> => {
  const now = clock.now()
  const resolved = await resolveStoredTown(playerId, towns, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const town = resolved.value.town
  const called = town.jobs.callBack(sentAt, now, catalog)
  if (!called.ok) {
    return called
  }
  const calledBack = town.changedBy(called.value)
  const saved = await saveChangedTown(
    { town: calledBack, events: resolved.value.events },
    towns,
    news,
  )
  if (!saved.ok) {
    return saved
  }
  const cancelled = await cleanUps.cancel(calledBack.id, sentAt)
  return cancelled.ok ? ok(calledBack) : cancelled
}
