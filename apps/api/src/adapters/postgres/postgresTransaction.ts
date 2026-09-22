import type { FiefRepository, Result } from '@mygame/domain'
import { TransactionRollbackError } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { DrizzleAccounts } from './DrizzleAccounts'
import { DrizzleFiefRepository } from './DrizzleFiefRepository'

export type TransactionStores = {
  readonly fiefs: FiefRepository
  readonly accounts: DrizzleAccounts
}

export type Transaction = <T, E>(
  work: (stores: TransactionStores) => Promise<Result<T, E>>,
) => Promise<Result<T, E>>

export const postgresTransaction =
  (database: NodePgDatabase): Transaction =>
  async <T, E>(
    work: (stores: TransactionStores) => Promise<Result<T, E>>,
  ): Promise<Result<T, E>> => {
    let refused: Result<T, E> | undefined
    try {
      return await database.transaction(async (transaction) => {
        const outcome = await work({
          fiefs: new DrizzleFiefRepository(transaction, 'lockedForUpdate'),
          accounts: new DrizzleAccounts(transaction),
        })
        if (!outcome.ok) {
          refused = outcome
          transaction.rollback()
        }
        return outcome
      })
    } catch (failure) {
      if (failure instanceof TransactionRollbackError && refused !== undefined) {
        return refused
      }
      throw failure
    }
  }
