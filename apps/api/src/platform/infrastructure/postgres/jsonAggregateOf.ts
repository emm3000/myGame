import { type Column, type SQL, sql } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'

export const jsonAggregateOf = (
  table: PgTable,
  fields: Readonly<Record<string, Column | SQL>>,
  owner: SQL,
  order: SQL,
): SQL<unknown> => {
  const pairs = sql.join(
    Object.entries(fields).map(([key, column]) => sql`${sql.raw(`'${key}'`)}, ${column}`),
    sql`, `,
  )
  return sql<unknown>`(SELECT coalesce(json_agg(json_build_object(${pairs}) ORDER BY ${order}), '[]'::json) FROM ${table} WHERE ${owner})`
}
