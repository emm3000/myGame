import type { CampRegistry, ChronicleWriter, FiefRepository, Result } from '@mygame/domain'
import { TransactionRollbackError } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { Accounts } from '../../auth/Accounts'
import type { AccountTokens } from '../../auth/AccountTokens'
import { DrizzleAccounts } from './DrizzleAccounts'
import { DrizzleAccountTokens } from './DrizzleAccountTokens'
import { DrizzleCampRegistry } from './DrizzleCampRegistry'
import { DrizzleChronicle } from './DrizzleChronicle'
import { DrizzleFiefRepository } from './DrizzleFiefRepository'

export type TransactionStores = {
  readonly fiefs: FiefRepository
  readonly chronicle: ChronicleWriter
  readonly camps: CampRegistry
  readonly accounts: Accounts
  readonly accountTokens: AccountTokens
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
          camps: new DrizzleCampRegistry(transaction),
          accounts: new DrizzleAccounts(transaction),
          accountTokens: new DrizzleAccountTokens(transaction),
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
