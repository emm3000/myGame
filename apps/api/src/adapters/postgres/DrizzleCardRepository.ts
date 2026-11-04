import {
  type CardRepository,
  type DomainError,
  type HeldCard,
  ok,
  type PlayerId,
  type Result,
} from '@mygame/domain'
import { eq, sql } from 'drizzle-orm'
import type { PostgresSession } from './connectPostgres'
import { cards } from './schema'
import { cardColumnsOf, heldCardOf } from './storedMemoryCards'

export class DrizzleCardRepository implements CardRepository {
  constructor(private readonly database: PostgresSession) {}

  async cardsOf(playerId: PlayerId): Promise<Result<ReadonlyArray<HeldCard>, DomainError>> {
    const rows = await this.database
      .select()
      .from(cards)
      .where(eq(cards.playerId, playerId))
      .orderBy(sql`${cards.wordId} COLLATE "C"`)
    const held: Array<HeldCard> = []
    for (const row of rows) {
      const card = heldCardOf(row, playerId)
      if (!card.ok) {
        return card
      }
      held.push(card.value)
    }
    return ok(held)
  }

  async save(playerId: PlayerId, { wordId, card }: HeldCard): Promise<Result<void, DomainError>> {
    const columns = cardColumnsOf(card.stored)
    await this.database
      .insert(cards)
      .values({ playerId, wordId, ...columns })
      .onConflictDoUpdate({ target: [cards.playerId, cards.wordId], set: columns })
    return ok(undefined)
  }
}
