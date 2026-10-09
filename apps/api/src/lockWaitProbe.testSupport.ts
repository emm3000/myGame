import type { Client, Pool } from 'pg'

export const lockProbeLimit = 200

export const lockedFiefReadQuery = 'select "fiefs"."id", %'

export const isWaitingOnALock = async (
  observer: Client | Pool,
  queries: ReadonlyArray<string>,
): Promise<boolean> => {
  const probe = await observer.query<{ waiting: boolean }>(
    `SELECT pg_sleep(0.01), EXISTS (
       SELECT 1 FROM pg_stat_activity
       WHERE datname = current_database()
         AND pid <> pg_backend_pid()
         AND wait_event_type = 'Lock'
         AND query ILIKE ANY($1::text[])
     ) AS waiting`,
    [queries],
  )
  return probe.rows[0]?.waiting === true
}
