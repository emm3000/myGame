import type { Clock, DomainError, FiefOfPlayer, Result } from '@mygame/domain'
import type { Transaction, TransactionStores } from '../adapters/postgres/postgresTransaction'
import { fiefsOfLordHolding } from './fiefsOfLordHolding'
import { laterOf } from './laterOf'
import {
  type ResolveInTransactionDependencies,
  resolveFiefInTransaction,
} from './resolveFiefInTransaction'

export type MutateAfterResolveDependencies = ResolveInTransactionDependencies & {
  readonly inTransaction: Transaction
  readonly clock: Clock
}

export type FiefStores = Pick<
  TransactionStores,
  'fiefs' | 'chronicle' | 'camps' | 'cards' | 'pendingReviews' | 'reviewLog'
>

export type FiefMutation<T> = (stores: FiefStores, clock: Clock) => Promise<Result<T, DomainError>>

export const mutateAfterResolve = async <T>(
  fiefOfPlayer: FiefOfPlayer,
  mutation: FiefMutation<T>,
  dependencies: MutateAfterResolveDependencies,
): Promise<Result<T, DomainError>> =>
  dependencies.inTransaction(async (stores) => {
    const held = await fiefsOfLordHolding(fiefOfPlayer, stores.fiefs)
    if (!held.ok) {
      return held
    }
    const locked = await stores.fiefs.fiefOf(fiefOfPlayer.fiefId)
    if (!locked.ok) {
      return locked
    }
    const now = dependencies.clock.now()
    const mutatedAt = locked.value === undefined ? now : laterOf(now, locked.value.storedAt)
    const mutationClock: Clock = { now: () => mutatedAt }
    const resolved = await resolveFiefInTransaction(
      fiefOfPlayer,
      stores,
      mutationClock,
      dependencies,
    )
    if (!resolved.ok) {
      return resolved
    }
    return mutation(stores, mutationClock)
  })
