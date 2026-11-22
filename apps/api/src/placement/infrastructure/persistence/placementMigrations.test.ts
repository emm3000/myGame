import type { Client } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  checkViolation,
  closeWithoutChanges,
  foreignKeyViolation,
  invalidEnumValue,
  migratedThroughNext,
  openEmptyDatabase,
  uniqueViolation,
} from '#platform/infrastructure/persistence/migrationDatabase.testSupport'

const placementOwnerId = '00000000-0000-4000-8000-0000000000a6'

const migrationsBeforeThePlacement = 40

const insertPlacement = async (client: Client, kind: string): Promise<void> => {
  await client.query(
    `INSERT INTO placements (player_id, kind, decided_at) VALUES ($1, $2, '2026-11-12T09:00:00Z')`,
    [placementOwnerId, kind],
  )
}

const insertPlacementScore = async (client: Client, band: number, score: number): Promise<void> => {
  await client.query(
    `INSERT INTO placement_scores (player_id, band, score, taken_at)
     VALUES ($1, $2, $3, '2026-11-12T09:10:00Z')`,
    [placementOwnerId, band, score],
  )
}

const insertPlacementWord = async (
  client: Client,
  band: number,
  position: number,
  wordId: string,
): Promise<void> => {
  await client.query(
    'INSERT INTO placement_words (player_id, band, position, word_id) VALUES ($1, $2, $3, $4)',
    [placementOwnerId, band, position, wordId],
  )
}

describe('the placement migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
    await migratedThroughNext(client, migrationsBeforeThePlacement, async () => {
      await client.query(
        `INSERT INTO players (id, email, password_hash, created_at, report_read_at)
         VALUES ($1, 'learner@example.com', 'argon2id-hash', '2026-11-12T08:00:00Z', '2026-11-12T08:00:00Z')`,
        [placementOwnerId],
      )
    })
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps a player stored before the migration with no placement', async () => {
    const stored = await client.query('SELECT count(*)::int AS count FROM placements')

    expect(stored.rows).toEqual([{ count: 0 }])
  })

  it('stores per band the score and the instant', async () => {
    await insertPlacement(client, 'taken')
    await insertPlacementScore(client, 1, 29)

    const stored = await client.query(
      'SELECT band, score, taken_at FROM placement_scores WHERE player_id = $1',
      [placementOwnerId],
    )

    expect(stored.rows).toEqual([
      { band: 1, score: 29, taken_at: new Date('2026-11-12T09:10:00Z') },
    ])
  })

  it('refuses a second placement of one player', async () => {
    await insertPlacement(client, 'taken')

    await expect(insertPlacement(client, 'skipped')).rejects.toMatchObject({
      code: uniqueViolation,
      constraint: 'placements_pkey',
    })
  })

  it('refuses a second score of one band', async () => {
    await insertPlacement(client, 'taken')
    await insertPlacementScore(client, 1, 29)

    await expect(insertPlacementScore(client, 1, 3)).rejects.toMatchObject({
      code: uniqueViolation,
      constraint: 'placement_scores_pkey',
    })
  })

  it('refuses a score above 30', async () => {
    await insertPlacement(client, 'taken')

    await expect(insertPlacementScore(client, 1, 31)).rejects.toMatchObject({
      code: checkViolation,
      constraint: 'placement_scores_score_range',
    })
  })

  it('refuses a band the curriculum lacks', async () => {
    await insertPlacement(client, 'taken')

    await expect(insertPlacementScore(client, 4, 29)).rejects.toMatchObject({
      code: checkViolation,
      constraint: 'placement_scores_band_known',
    })
  })

  it('refuses a score with no placement', async () => {
    await expect(insertPlacementScore(client, 1, 29)).rejects.toMatchObject({
      code: foreignKeyViolation,
    })
  })

  it('refuses one word sampled twice in a band', async () => {
    await insertPlacement(client, 'taken')
    await insertPlacementWord(client, 1, 1, 'word-90')

    await expect(insertPlacementWord(client, 1, 2, 'word-90')).rejects.toMatchObject({
      code: uniqueViolation,
      constraint: 'placement_words_word_unique',
    })
  })

  it('refuses a placement kind the game does not know', async () => {
    await expect(insertPlacement(client, 'abandoned')).rejects.toMatchObject({
      code: invalidEnumValue,
    })
  })

  it("drops a player's placement, sample and scores with the player", async () => {
    await insertPlacement(client, 'taken')
    await insertPlacementWord(client, 1, 1, 'word-90')
    await insertPlacementScore(client, 1, 29)

    await client.query('DELETE FROM players WHERE id = $1', [placementOwnerId])

    const stored = await client.query(
      `SELECT (SELECT count(*) FROM placements)::int AS placements,
              (SELECT count(*) FROM placement_words)::int AS words,
              (SELECT count(*) FROM placement_scores)::int AS scores`,
    )
    expect(stored.rows).toEqual([{ placements: 0, words: 0, scores: 0 }])
  })
})
