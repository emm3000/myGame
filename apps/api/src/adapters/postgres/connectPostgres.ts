import { drizzle, type NodePgDatabase, type NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import type { PgDatabase } from 'drizzle-orm/pg-core'
import { Pool } from 'pg'

export type PostgresSession = PgDatabase<NodePgQueryResultHKT>

export type PostgresConnection = {
  readonly database: NodePgDatabase
  readonly close: () => Promise<void>
}

export const connectPostgres = (databaseUrl: string): PostgresConnection => {
  const pool = new Pool({ connectionString: databaseUrl })
  return { database: drizzle(pool), close: () => pool.end() }
}
