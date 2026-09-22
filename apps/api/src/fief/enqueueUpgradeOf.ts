import {
  type BuildingCatalog,
  type BuildingKind,
  type Clock,
  type DomainError,
  enqueueBuilding,
  type Fief,
  type PlayerId,
  type Result,
  resolveUpgrade,
} from '@mygame/domain'
import type { Transaction } from '../adapters/postgres/postgresTransaction'
import { laterOf } from './laterOf'

export type EnqueueUpgradeDependencies = {
  readonly inTransaction: Transaction
  readonly buildingCatalog: BuildingCatalog
  readonly clock: Clock
}

export const enqueueUpgradeOf = async (
  playerId: PlayerId,
  building: BuildingKind,
  { inTransaction, buildingCatalog, clock }: EnqueueUpgradeDependencies,
): Promise<Result<Fief, DomainError>> =>
  inTransaction(async ({ fiefs }) => {
    const locked = await fiefs.fiefOf(playerId)
    if (!locked.ok) {
      return locked
    }
    const now = clock.now()
    const enqueuedAt = locked.value === undefined ? now : laterOf(now, locked.value.storedAt)
    const enqueueClock: Clock = { now: () => enqueuedAt }
    const resolved = await resolveUpgrade(
      { playerId },
      { fiefs, catalog: buildingCatalog, clock: enqueueClock },
    )
    if (!resolved.ok) {
      return resolved
    }
    return enqueueBuilding(
      { playerId, building },
      { fiefs, catalog: buildingCatalog, clock: enqueueClock },
    )
  })
