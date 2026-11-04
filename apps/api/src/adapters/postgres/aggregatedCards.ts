import { type DomainError, type HeldCard, ok, type Result } from '@mygame/domain'
import { type Column, type SQL, sql } from 'drizzle-orm'
import { z } from 'zod'
import { cards, memoryRating, memoryState } from './schema'
import { heldCardOf } from './storedMemoryCards'

const TimestampSchema = z.string().transform((iso) => new Date(iso))

const AggregatedCardsSchema = z.array(
  z.strictObject({
    wordId: z.string(),
    state: z.enum(memoryState.enumValues),
    step: z.number().int().nullable(),
    stability: z.number().nullable(),
    difficulty: z.number().nullable(),
    lastReviewAt: TimestampSchema.nullable(),
    lastRating: z.enum(memoryRating.enumValues).nullable(),
    enteredAt: TimestampSchema,
    retainedAt: TimestampSchema.nullable(),
  }),
)

export const aggregatedCardsOf = (playerId: Column): SQL<unknown> =>
  sql<unknown>`(SELECT coalesce(json_agg(json_build_object('wordId', ${cards.wordId}, 'state', ${cards.state}, 'step', ${cards.step}, 'stability', ${cards.stability}, 'difficulty', ${cards.difficulty}, 'lastReviewAt', ${cards.lastReviewAt}, 'lastRating', ${cards.lastRating}, 'enteredAt', ${cards.enteredAt}, 'retainedAt', ${cards.retainedAt}) ORDER BY ${cards.wordId} COLLATE "C"), '[]'::json) FROM ${cards} WHERE ${cards.playerId} = ${playerId})`

export const heldCardsOf = (
  aggregate: unknown,
  playerId: string,
): Result<ReadonlyArray<HeldCard>, DomainError> => {
  const held: Array<HeldCard> = []
  for (const row of AggregatedCardsSchema.parse(aggregate)) {
    const card = heldCardOf(row, playerId)
    if (!card.ok) {
      return card
    }
    held.push(card.value)
  }
  return ok(held)
}
