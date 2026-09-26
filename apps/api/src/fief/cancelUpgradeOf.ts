import {
  type BuildingCatalog,
  type Clock,
  cancelUpgrade,
  type DomainError,
  type Fief,
  type PlayerId,
  type Result,
  resolveUpgrade,
} from '@mygame/domain'
import type { Transaction } from '../adapters/postgres/postgresTransaction'
import { laterOf } from './laterOf'

export type CancelUpgradeDependencies = {
  readonly inTransaction: Transaction
  readonly buildingCatalog: BuildingCatalog
  readonly clock: Clock
}

export const cancelUpgradeOf = async (
  playerId: PlayerId,
  position: number,
  { inTransaction, buildingCatalog, clock }: CancelUpgradeDependencies,
): Promise<Result<Fief, DomainError>> =>
  inTransaction(async ({ fiefs }) => {
    const locked = await fiefs.fiefOf(playerId)
    if (!locked.ok) {
      return locked
    }
    const now = clock.now()
    const cancelledAt = locked.value === undefined ? now : laterOf(now, locked.value.storedAt)
    const cancelClock: Clock = { now: () => cancelledAt }
    const resolved = await resolveUpgrade(
      { playerId },
      { fiefs, catalog: buildingCatalog, clock: cancelClock },
    )
    if (!resolved.ok) {
      return resolved
    }
    return cancelUpgrade(
      { playerId, position },
      { fiefs, catalog: buildingCatalog, clock: cancelClock },
    )
  })
