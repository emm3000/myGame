import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { players } from '#account/infrastructure/persistence/accountTables'
import { truncatePlayerTables } from '#truncatePlayerTables.testSupport'

export type TownTestDatabase = {
  readonly open: () => void
  readonly close: () => Promise<void>
  readonly pool: () => Pool
  readonly registerPlayers: (playerIds: ReadonlyArray<string>) => Promise<void>
  readonly truncateAll: () => Promise<void>
}

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

export const townTestDatabase = (): TownTestDatabase => {
  let pool: Pool

  const open = (): void => {
    pool = new Pool({ connectionString: databaseUrl() })
  }

  const close = async (): Promise<void> => {
    await pool.end()
  }

  const registerPlayers = async (playerIds: ReadonlyArray<string>): Promise<void> => {
    if (playerIds.length === 0) {
      return
    }
    await drizzle(pool)
      .insert(players)
      .values(
        playerIds.map((id) => ({
          id,
          email: `${id}@example.com`,
          passwordHash: 'argon2id-hash',
          createdAt: new Date('2026-11-04T08:00:00Z'),
          digestAcknowledgedAt: new Date('2026-11-04T08:00:00Z'),
          reportReadAt: new Date('2026-11-04T08:00:00Z'),
          scaffold: 'es' as const,
        })),
      )
  }

  const truncateAll = async (): Promise<void> => {
    await pool.query(truncatePlayerTables)
  }

  return { open, close, pool: () => pool, registerPlayers, truncateAll }
}
