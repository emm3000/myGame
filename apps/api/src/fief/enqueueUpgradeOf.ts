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

export type EnqueueUpgradeDependencies = {
  readonly inTransaction: Transaction
  readonly buildingCatalog: BuildingCatalog
  readonly clock: Clock
}

export const enqueueUpgradeOf = async (
  playerId: PlayerId,
  building: BuildingKind,
  { inTransaction, buildingCatalog, clock }: EnqueueUpgradeDependencies,
): Promise<Result<Fief, DomainError>> => {
  const now = clock.now()
  const enqueueClock: Clock = { now: () => now }
  return inTransaction(async ({ fiefs }) => {
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
}
