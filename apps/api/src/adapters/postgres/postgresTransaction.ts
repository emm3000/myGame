import type {
  CampRegistry,
  CardRepository,
  ChronicleWriter,
  FiefRepository,
  PendingReviewRepository,
  Result,
  ReviewLog,
} from '@mygame/domain'
import { TransactionRollbackError } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { Accounts } from '../../auth/Accounts'
import type { AccountTokens } from '../../auth/AccountTokens'
import { DrizzleAccounts } from './DrizzleAccounts'
import { DrizzleAccountTokens } from './DrizzleAccountTokens'
import { DrizzleCampRegistry } from './DrizzleCampRegistry'
import { DrizzleCardRepository } from './DrizzleCardRepository'
import { DrizzleChronicle } from './DrizzleChronicle'
import { DrizzleFiefRepository } from './DrizzleFiefRepository'
import { DrizzlePendingReviewRepository } from './DrizzlePendingReviewRepository'
import { DrizzleReviewLog } from './DrizzleReviewLog'

export type TransactionStores = {
  readonly fiefs: FiefRepository
  readonly chronicle: ChronicleWriter
  readonly camps: CampRegistry
  readonly accounts: Accounts
  readonly accountTokens: AccountTokens
  readonly cards: CardRepository
  readonly pendingReviews: PendingReviewRepository
  readonly reviewLog: ReviewLog
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
          cards: new DrizzleCardRepository(transaction),
          pendingReviews: new DrizzlePendingReviewRepository(transaction),
          reviewLog: new DrizzleReviewLog(transaction),
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
