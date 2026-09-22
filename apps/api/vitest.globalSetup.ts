import { migratePostgres } from './src/adapters/postgres/migratePostgres'

export async function setup(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }
  await migratePostgres(databaseUrl)
}
