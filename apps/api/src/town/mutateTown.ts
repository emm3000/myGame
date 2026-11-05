import type { Clock, DomainError, PlayerId, Result } from '@mygame/domain'
import type { Transaction, TransactionStores } from '../adapters/postgres/postgresTransaction'
import { laterOf } from '../time/laterOf'

export type TownStores = Pick<TransactionStores, 'towns' | 'townNews'>

export type TownMutation<T> = (stores: TownStores, clock: Clock) => Promise<Result<T, DomainError>>

export type MutateTownDependencies = {
  readonly inTransaction: Transaction
  readonly clock: Clock
}

export const mutateTown = <T>(
  playerId: PlayerId,
  mutation: TownMutation<T>,
  { inTransaction, clock }: MutateTownDependencies,
): Promise<Result<T, DomainError>> =>
  inTransaction(async (stores) => {
    const locked = await stores.towns.townOf(playerId)
    if (!locked.ok) {
      return locked
    }
    const now = clock.now()
    const mutatedAt = locked.value === undefined ? now : laterOf(now, locked.value.storedAt)
    return mutation(stores, { now: () => mutatedAt })
  })
