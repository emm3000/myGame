import { Client } from 'pg'
import type { TestProject } from 'vitest/node'
import { migratePostgres } from './src/adapters/postgres/migratePostgres'

declare module 'vitest' {
  export interface ProvidedContext {
    workerDatabaseUrls: ReadonlyArray<string>
  }
}

const siblingDatabaseUrl = (databaseUrl: string, suffix: string): string => {
  const url = new URL(databaseUrl)
  url.pathname = `${url.pathname}_${suffix}`
  return url.href
}

const databaseNameOf = (databaseUrl: string): string => new URL(databaseUrl).pathname.slice(1)

const recreateDatabase = async (
  maintenance: Client,
  databaseUrl: string,
  templateUrl?: string,
): Promise<void> => {
  const database = maintenance.escapeIdentifier(databaseNameOf(databaseUrl))
  const template = templateUrl
    ? ` TEMPLATE ${maintenance.escapeIdentifier(databaseNameOf(templateUrl))}`
    : ''
  await maintenance.query(`DROP DATABASE IF EXISTS ${database} WITH (FORCE)`)
  await maintenance.query(`CREATE DATABASE ${database}${template}`)
}

export async function setup(project: TestProject): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }
  const templateUrl = siblingDatabaseUrl(databaseUrl, 'template')
  const workerDatabaseUrls = Array.from({ length: project.config.maxWorkers }, (_, index) =>
    siblingDatabaseUrl(databaseUrl, `worker_${index + 1}`),
  )
  const maintenance = new Client({ connectionString: databaseUrl })
  await maintenance.connect()
  try {
    await recreateDatabase(maintenance, templateUrl)
    await migratePostgres(templateUrl)
    for (const workerDatabaseUrl of workerDatabaseUrls) {
      await recreateDatabase(maintenance, workerDatabaseUrl, templateUrl)
    }
  } finally {
    await maintenance.end()
  }
  project.provide('workerDatabaseUrls', workerDatabaseUrls)
}
