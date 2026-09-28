import type { ChronicleWriter, FiefRepository, Result } from '@mygame/domain'
import { TransactionRollbackError } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { Accounts } from '../../auth/Accounts'
import { DrizzleAccounts } from './DrizzleAccounts'
import { DrizzleChronicle } from './DrizzleChronicle'
import { DrizzleFiefRepository } from './DrizzleFiefRepository'

export type TransactionStores = {
  readonly fiefs: FiefRepository
  readonly chronicle: ChronicleWriter
  readonly accounts: Accounts
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
          chronicle: new DrizzleChronicle(transaction),
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
