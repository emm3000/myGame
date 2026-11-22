import type { Result, UnitOfWork } from '@mygame/domain'
import { TransactionRollbackError } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { PostgresSession } from './connectPostgres'

export class DrizzleUnitOfWork<Stores> implements UnitOfWork<Stores> {
  constructor(
    private readonly database: NodePgDatabase,
    private readonly composeStores: (transaction: PostgresSession) => Stores,
  ) {}

  async transact<T, E>(work: (stores: Stores) => Promise<Result<T, E>>): Promise<Result<T, E>> {
    let refused: Result<T, E> | undefined
    try {
      return await this.database.transaction(async (transaction) => {
        const outcome = await work(this.composeStores(transaction))
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
}
