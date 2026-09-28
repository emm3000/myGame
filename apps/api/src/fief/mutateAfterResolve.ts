import {
  type BuildingCatalog,
  type Clock,
  type DomainError,
  type FiefRepository,
  type PlayerId,
  type Result,
  resolveUpgrade,
} from '@mygame/domain'
import type { Transaction } from '../adapters/postgres/postgresTransaction'
import { laterOf } from './laterOf'

export type MutateAfterResolveDependencies = {
  readonly inTransaction: Transaction
  readonly buildingCatalog: BuildingCatalog
  readonly clock: Clock
}

export type FiefMutation<Mutated> = (
  fiefs: FiefRepository,
  clock: Clock,
) => Promise<Result<Mutated, DomainError>>

export const mutateAfterResolve = async <Mutated>(
  playerId: PlayerId,
  mutation: FiefMutation<Mutated>,
  { inTransaction, buildingCatalog, clock }: MutateAfterResolveDependencies,
): Promise<Result<Mutated, DomainError>> =>
  inTransaction(async ({ fiefs }) => {
    const locked = await fiefs.fiefOf(playerId)
    if (!locked.ok) {
      return locked
    }
    const now = clock.now()
    const mutatedAt = locked.value === undefined ? now : laterOf(now, locked.value.storedAt)
    const mutationClock: Clock = { now: () => mutatedAt }
    const resolved = await resolveUpgrade(
      { playerId },
      { fiefs, catalog: buildingCatalog, clock: mutationClock },
    )
    if (!resolved.ok) {
      return resolved
    }
    return mutation(fiefs, mutationClock)
  })
