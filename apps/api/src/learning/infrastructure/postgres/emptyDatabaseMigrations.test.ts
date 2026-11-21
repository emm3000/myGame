import { eq } from 'drizzle-orm'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { Client } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { tokenDigest } from '#account/application/tokenDigest'
import { accountTokens, players, sessions } from '#account/infrastructure/postgres/accountTables'
import { ana, bruno } from '#account/infrastructure/postgres/migrationPlayers.testSupport'
import {
  applyMigrations,
  checkViolation,
  closeWithoutChanges,
  foreignKeyViolation,
  migrationsFolder,
  openEmptyDatabase,
  uniqueViolation,
} from '#platform/infrastructure/postgres/migrationDatabase.testSupport'
import { insertTownOf, plainStocks } from '#town/infrastructure/postgres/migrationTowns.testSupport'
import { earnedSkills } from '#town/infrastructure/postgres/schoolTables'
import { cards, pendingReviews, reviewLog } from './learningTables'

const lessonFinishedAt = new Date('2026-11-10T09:00:00Z')

function enteredCardOf(playerId: string): typeof cards.$inferInsert {
  return { playerId, wordId: 'school', state: 'learning', step: 0, enteredAt: lessonFinishedAt }
}

function reviewedCardOf(playerId: string): typeof cards.$inferInsert {
  return {
    playerId,
    wordId: 'school',
    state: 'review',
    step: null,
    stability: 10.971,
    difficulty: 2.1043,
    lastReviewAt: new Date('2026-11-12T09:10:00Z'),
    lastRating: 'good',
    enteredAt: lessonFinishedAt,
  }
}

function firstReviewOf(playerId: string): typeof reviewLog.$inferInsert {
  return {
    playerId,
    wordId: 'school',
    reviewedAt: lessonFinishedAt,
    format: 'recognition',
    answer: 'school',
    hintShown: false,
    rating: 'good',
    beforeState: 'learning',
    beforeStep: 0,
    beforeEnteredAt: lessonFinishedAt,
    afterState: 'learning',
    afterStep: 1,
    afterStability: 2.3065,
    afterDifficulty: 2.1181,
    afterLastReviewAt: lessonFinishedAt,
    afterLastRating: 'good',
    afterEnteredAt: lessonFinishedAt,
  }
}

function foodSkillOf(playerId: string): typeof earnedSkills.$inferInsert {
  return {
    playerId,
    lessonId: 'lesson-1',
    resource: 'food',
    ratePercent: 5,
    earnedAt: new Date('2026-11-23T09:10:00Z'),
  }
}

describe('the migrations', () => {
  let client: Client
  let db: NodePgDatabase

  beforeEach(async () => {
    client = await openEmptyDatabase()
    await applyMigrations(client, readMigrationFiles({ migrationsFolder }))
    db = drizzle(client)
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('applies the migration to an empty database', async () => {
    const tables = await client.query<{ name: string }>(
      "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
    )

    expect(tables.rows.map((row) => row.name)).toEqual([
      'account_tokens',
      'band_starts',
      'cards',
      'earned_skills',
      'held_out_words',
      'holdout_check_words',
      'holdout_checks',
      'pending_reviews',
      'placement_scores',
      'placement_words',
      'placements',
      'player_seen_tips',
      'players',
      'review_log',
      'sessions',
      'site_clean_ups',
      'town_buildings',
      'town_events',
      'town_hires',
      'town_hiring_orders',
      'town_jobs',
      'town_lesson_slots',
      'town_waiting_work',
      'towns',
    ])
  })

  it("drops a deleted player's cards, pending reviews and review log", async () => {
    await db.insert(players).values([ana, bruno])
    for (const playerId of [ana.id, bruno.id]) {
      await db.insert(cards).values(enteredCardOf(playerId))
      await db.insert(pendingReviews).values({ playerId, wordId: 'school', hintShown: true })
      await db.insert(reviewLog).values(firstReviewOf(playerId))
    }

    await db.delete(players).where(eq(players.id, ana.id))

    const owners: Array<ReadonlyArray<{ playerId: string }>> = []
    for (const table of [cards, pendingReviews, reviewLog]) {
      owners.push(await db.select({ playerId: table.playerId }).from(table))
    }
    expect(owners).toEqual([
      [{ playerId: bruno.id }],
      [{ playerId: bruno.id }],
      [{ playerId: bruno.id }],
    ])
  })

  it('refuses a second card of one word for one player', async () => {
    await db.insert(players).values(ana)
    await db.insert(cards).values(enteredCardOf(ana.id))

    await expect(db.insert(cards).values(enteredCardOf(ana.id))).rejects.toMatchObject({
      cause: { code: uniqueViolation, constraint: 'cards_pkey' },
    })
  })

  it('refuses a pending review of a word the player holds no card of', async () => {
    await db.insert(players).values(ana)

    await expect(
      db.insert(pendingReviews).values({ playerId: ana.id, wordId: 'school', hintShown: true }),
    ).rejects.toMatchObject({
      cause: { code: foreignKeyViolation, constraint: 'pending_reviews_card_fk' },
    })
  })

  it("drops a card's pending review with the card", async () => {
    await db.insert(players).values(ana)
    await db.insert(cards).values(enteredCardOf(ana.id))
    await db.insert(pendingReviews).values({ playerId: ana.id, wordId: 'school', hintShown: true })

    await db.delete(cards)

    expect(await db.select().from(pendingReviews)).toEqual([])
  })

  it('refuses a card in review that holds a learning step', async () => {
    await db.insert(players).values(ana)

    await expect(
      db.insert(cards).values({ ...reviewedCardOf(ana.id), step: 1 }),
    ).rejects.toMatchObject({ cause: { code: checkViolation, constraint: 'cards_step_terms' } })
  })

  it('refuses a reviewed card stored without its last rating', async () => {
    await db.insert(players).values(ana)

    await expect(
      db.insert(cards).values({ ...reviewedCardOf(ana.id), lastRating: null }),
    ).rejects.toMatchObject({ cause: { code: checkViolation, constraint: 'cards_review_terms' } })
  })

  it('refuses a card retained at an instant other than its last review', async () => {
    await db.insert(players).values(ana)

    await expect(
      db
        .insert(cards)
        .values({ ...reviewedCardOf(ana.id), retainedAt: new Date('2026-11-10T09:00:00Z') }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'cards_retained_at_last_review' },
    })
  })

  it('refuses a skill a player earned twice from one lesson', async () => {
    await db.insert(players).values(ana)
    await db.insert(earnedSkills).values({ ...foodSkillOf(ana.id), resource: 'material' })

    await expect(
      db.insert(earnedSkills).values({ ...foodSkillOf(ana.id), resource: 'material' }),
    ).rejects.toMatchObject({ cause: { code: uniqueViolation, constraint: 'earned_skills_pkey' } })
  })

  it("drops a deleted player's earned skills", async () => {
    await db.insert(players).values([ana, bruno])
    for (const playerId of [ana.id, bruno.id]) {
      await db.insert(earnedSkills).values({ ...foodSkillOf(playerId), resource: 'food' })
    }

    await db.delete(players).where(eq(players.id, ana.id))

    expect(await db.select({ playerId: earnedSkills.playerId }).from(earnedSkills)).toEqual([
      { playerId: bruno.id },
    ])
  })

  it('refuses a town lesson that finishes before it starts', async () => {
    await db.insert(players).values(ana)
    await insertTownOf(client, ana.id, 1, plainStocks)

    await expect(
      client.query(
        `INSERT INTO town_lesson_slots (town_id, lesson_id, started_at, finishes_at)
         SELECT id, 'lesson-1', '2026-11-10T09:00:00Z', '2026-11-10T08:57:30Z' FROM towns`,
      ),
    ).rejects.toMatchObject({
      code: checkViolation,
      constraint: 'town_lesson_slots_started_before_finish',
    })
  })

  it("drops a deleted town's lesson slot", async () => {
    await db.insert(players).values(ana)
    await insertTownOf(client, ana.id, 1, plainStocks)
    await client.query(
      `INSERT INTO town_lesson_slots (town_id, lesson_id, started_at, finishes_at)
       SELECT id, 'lesson-1', '2026-11-10T08:57:30Z', '2026-11-10T09:00:00Z' FROM towns`,
    )

    await db.delete(players).where(eq(players.id, ana.id))

    expect((await client.query('SELECT town_id FROM town_lesson_slots')).rows).toEqual([])
  })

  it('refuses a review logged with elapsed days before any earlier review', async () => {
    await db.insert(players).values(ana)

    await expect(
      db.insert(reviewLog).values({ ...firstReviewOf(ana.id), elapsedDays: 0 }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'review_log_elapsed_days_terms' },
    })
  })

  it('refuses two players with the same email in different case', async () => {
    await db.insert(players).values(ana)

    await expect(
      db.insert(players).values({ ...bruno, email: 'ana@example.com' }),
    ).rejects.toMatchObject({
      cause: { code: uniqueViolation, constraint: 'players_email_unique' },
    })
  })

  it('refuses two sessions with the same token digest', async () => {
    await db.insert(players).values([ana, bruno])
    const expiresAt = new Date('2026-10-22T08:00:00Z')
    const digest = tokenDigest('opaque-token')
    await db.insert(sessions).values({ tokenDigest: digest, playerId: ana.id, expiresAt })

    await expect(
      db.insert(sessions).values({ tokenDigest: digest, playerId: bruno.id, expiresAt }),
    ).rejects.toMatchObject({ cause: { code: uniqueViolation, constraint: 'sessions_pkey' } })
  })

  it('refuses a session stored with a plain token', async () => {
    await db.insert(players).values(ana)

    await expect(
      db.insert(sessions).values({
        tokenDigest: 'opaque-token',
        playerId: ana.id,
        expiresAt: new Date('2026-10-22T08:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'sessions_token_digest_hex' },
    })
  })

  it('refuses an account token stored with a plain token', async () => {
    await db.insert(players).values(ana)

    await expect(
      db.insert(accountTokens).values({
        tokenDigest: 'opaque-token',
        playerId: ana.id,
        kind: 'verify',
        expiresAt: new Date('2026-09-23T08:00:00Z'),
      }),
    ).rejects.toMatchObject({
      cause: { code: checkViolation, constraint: 'account_tokens_token_digest_hex' },
    })
  })

  it('drops the tokens of a deleted player', async () => {
    await db.insert(players).values(ana)
    await db.insert(accountTokens).values({
      tokenDigest: tokenDigest('opaque-token'),
      playerId: ana.id,
      kind: 'reset',
      expiresAt: new Date('2026-09-22T09:00:00Z'),
    })

    await db.delete(players)

    expect(await db.select().from(accountTokens)).toEqual([])
  })
})
