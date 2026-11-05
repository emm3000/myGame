import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import { err, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { finishBuildingWork } from './finishBuildingWork'
import type { ChangedTown } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownRepository } from './TownRepository'

export const resolvedTownOf = async (
  playerId: PlayerId,
  towns: TownRepository,
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
  return finishBuildingWork(stored.value, catalog, now)
}
