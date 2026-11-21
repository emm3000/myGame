import type { Result } from '@mygame/domain'
import { sql, TransactionRollbackError } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { Transaction } from '../../application/ports/Transaction'
import type { PostgresSession } from './connectPostgres'

export const statementTimeoutMilliseconds = 2_000

const statementTimeout = sql.raw(`SET LOCAL statement_timeout = ${statementTimeoutMilliseconds}`)

export const postgresTransaction =
  <Stores>(
    database: NodePgDatabase,
    composeStores: (transaction: PostgresSession) => Stores,
  ): Transaction<Stores> =>
  async <T, E>(work: (stores: Stores) => Promise<Result<T, E>>): Promise<Result<T, E>> => {
    let refused: Result<T, E> | undefined
    try {
      return await database.transaction(async (transaction) => {
        await transaction.execute(statementTimeout)
        const outcome = await work(composeStores(transaction))
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
