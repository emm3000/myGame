import { defineConfig } from 'drizzle-kit'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set')
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/town/infrastructure/postgres/townTables.ts',
  out: './migrations',
  dbCredentials: { url: databaseUrl },
})
