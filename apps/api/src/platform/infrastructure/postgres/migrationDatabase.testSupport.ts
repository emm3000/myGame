import { readMigrationFiles } from 'drizzle-orm/migrator'
import { Client } from 'pg'
import { apiPackagePath } from '#apiPackagePath.testSupport'

export const migrationsFolder = apiPackagePath('migrations')

export const uniqueViolation = '23505'

export const checkViolation = '23514'

export const foreignKeyViolation = '23503'

export const invalidEnumValue = '22P02'

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

export const openEmptyDatabase = async (): Promise<Client> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  await client.query('BEGIN')
  await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE')
  await client.query('DROP SCHEMA public CASCADE')
  await client.query('CREATE SCHEMA public')
  return client
}

export const applyMigrations = async (
  client: Client,
  migrations: ReturnType<typeof readMigrationFiles>,
): Promise<void> => {
  for (const migration of migrations) {
    for (const statement of migration.sql) {
      await client.query(statement)
    }
  }
}

export const closeWithoutChanges = async (client: Client): Promise<void> => {
  await client.query('ROLLBACK')
  await client.end()
}

export const migratedFrom = async (
  client: Client,
  appliedCount: number,
  seed: () => Promise<void>,
): Promise<void> => {
  const migrations = readMigrationFiles({ migrationsFolder })
  await applyMigrations(client, migrations.slice(0, appliedCount))
  await seed()
  await applyMigrations(client, migrations.slice(appliedCount))
}

export const migratedThroughNext = async (
  client: Client,
  appliedCount: number,
  seed: () => Promise<void>,
): Promise<void> => {
  const migrations = readMigrationFiles({ migrationsFolder })
  await applyMigrations(client, migrations.slice(0, appliedCount))
  await seed()
  await applyMigrations(client, migrations.slice(appliedCount, appliedCount + 1))
}
