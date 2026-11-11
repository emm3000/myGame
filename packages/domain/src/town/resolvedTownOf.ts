import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { settleTownTo } from './settleTownTo'
import type { ChangedTown } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownRepository } from './TownRepository'

export const resolvedTownOf = async (
  playerId: PlayerId,
  towns: Pick<TownRepository, 'townOf'>,
  catalog: TownCatalog,
  now: Instant,
): Promise<Result<ChangedTown, DomainError>> => {
  const stored = await towns.townOf(playerId)
  if (!stored.ok) {
    return stored
  }
  if (stored.value === undefined) {
    return err({ kind: 'TownNotFound', playerId })
  }
  const settled = settleTownTo(stored.value, catalog, now)
  if (!settled.ok) {
    return settled
  }
  const closed = settled.value.town.closeHiring(now)
  return ok({ town: closed.town, events: [...settled.value.events, ...closed.events] })
}
