import type { Client } from 'pg'
import type { players } from './accountTables'

function aPlayer(id: string, email: string): typeof players.$inferInsert {
  return {
    id,
    email,
    passwordHash: 'argon2id-hash',
    createdAt: new Date('2026-09-22T08:00:00Z'),
    reportReadAt: new Date('2026-09-22T08:00:00Z'),
    scaffold: 'es',
  }
}

export const ana = aPlayer('00000000-0000-4000-8000-000000000001', 'Ana@Example.com')
export const bruno = aPlayer('00000000-0000-4000-8000-000000000002', 'bruno@example.com')

export const insertPlayersBeforeTheReport = async (client: Client): Promise<void> => {
  await client.query(
    `INSERT INTO players (id, email, password_hash, created_at, digest_acknowledged_at)
     VALUES ($1, $2, 'argon2id-hash', '2026-09-22T08:00:00Z', '2026-09-22T08:00:00Z'),
            ($3, $4, 'argon2id-hash', '2026-09-22T08:00:00Z', '2026-09-22T08:00:00Z')`,
    [ana.id, ana.email, bruno.id, bruno.email],
  )
}
