import { pgEnum, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { players } from '#account/infrastructure/postgres/accountTables'

export const townTip = pgEnum('town_tip', [
  'people',
  'seasons',
  'waiting_list',
  'office',
  'jobs',
  'full_store',
])

export const playerSeenTips = pgTable(
  'player_seen_tips',
  {
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    tip: townTip('tip').notNull(),
  },
  (table) => [primaryKey({ name: 'player_seen_tips_pkey', columns: [table.playerId, table.tip] })],
)
