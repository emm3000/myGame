import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type { Clock } from '../ports/Clock'
import { ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { resolvedTownOf } from './resolvedTownOf'
import { saveChangedTown } from './saveChangedTown'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownNews } from './TownNews'
import type { TownRepository } from './TownRepository'

export type CallJobBackCommand = {
  readonly playerId: PlayerId
  readonly sentAt: Instant
}

export type CallJobBackDependencies = {
  readonly towns: TownRepository
  readonly news: TownNews
  readonly catalog: TownCatalog
  readonly clock: Clock
}

export const callJobBack = async (
  { playerId, sentAt }: CallJobBackCommand,
  { towns, news, catalog, clock }: CallJobBackDependencies,
): Promise<Result<Town, DomainError>> => {
  const now = clock.now()
  const resolved = await resolvedTownOf(playerId, towns, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const called = resolved.value.town.callJobBack(sentAt, now, catalog)
  if (!called.ok) {
    return called
  }
  const saved = await saveChangedTown(
    { town: called.value, events: resolved.value.events },
    towns,
    news,
  )
  if (!saved.ok) {
    return saved
  }
  return ok(called.value)
}
