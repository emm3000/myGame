import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Client } from 'pg'

const migrationsFolder = fileURLToPath(new URL('../../../migrations', import.meta.url))

export const migratePostgres = async (databaseUrl: string): Promise<void> => {
  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    await migrate(drizzle(client), { migrationsFolder })
  } finally {
    await client.end()
  }
}
