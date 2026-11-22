import {
  allOk,
  type DomainError,
  Instant,
  ok,
  type Placement,
  type PlacementRepository,
  type PlacementScore,
  type PlayerId,
  type Result,
  type TakenPlacement,
} from '@mygame/domain'
import { asc, eq } from 'drizzle-orm'
import type { PostgresSession } from '#platform/infrastructure/postgres/connectPostgres'
import { placementSamplesFromRows, type StoredPlacementWord } from './placementSamplesFromRows'
import { placementScoreFromRow } from './placementScoreFromRow'
import { placementScores, placements, placementWords } from './placementTables'

const instantOf = (date: Date): Instant => Instant.fromEpochMilliseconds(date.getTime())

const dateOf = (instant: Instant): Date => new Date(instant.epochMilliseconds)

export class DrizzlePlacementRepository implements PlacementRepository {
  constructor(private readonly database: PostgresSession) {}

  async placementOf(playerId: PlayerId): Promise<Result<Placement | undefined, DomainError>> {
    const [stored] = await this.database
      .select({ kind: placements.kind, decidedAt: placements.decidedAt })
      .from(placements)
      .where(eq(placements.playerId, playerId))
    if (stored === undefined) {
      return ok(undefined)
    }
    if (stored.kind === 'skipped') {
      return ok({ kind: 'skipped', skippedAt: instantOf(stored.decidedAt) })
    }
    const samples = placementSamplesFromRows(await this.wordRowsOf(playerId))
    if (!samples.ok) {
      return samples
    }
    const scores = await this.scoresOf(playerId)
    if (!scores.ok) {
      return scores
    }
    return ok({
      kind: 'taken',
      begunAt: instantOf(stored.decidedAt),
      samples: samples.value,
      scores: scores.value,
    })
  }

  async save(playerId: PlayerId, placement: Placement): Promise<Result<void, DomainError>> {
    const decidedAt = placement.kind === 'skipped' ? placement.skippedAt : placement.begunAt
    const inserted = await this.database
      .insert(placements)
      .values({ playerId, kind: placement.kind, decidedAt: dateOf(decidedAt) })
      .onConflictDoNothing({ target: placements.playerId })
      .returning({ kind: placements.kind })
    if (placement.kind === 'skipped') {
      return ok(undefined)
    }
    const isFirstSave = inserted.length > 0
    if (!isFirstSave && (await this.storedKindOf(playerId)) !== 'taken') {
      return ok(undefined)
    }
    if (isFirstSave) {
      await this.insertSamples(playerId, placement)
    }
    await this.insertScores(playerId, placement.scores)
    return ok(undefined)
  }

  private async storedKindOf(playerId: PlayerId): Promise<string | undefined> {
    const [stored] = await this.database
      .select({ kind: placements.kind })
      .from(placements)
      .where(eq(placements.playerId, playerId))
    return stored?.kind
  }

  private async insertSamples(playerId: PlayerId, { samples }: TakenPlacement): Promise<void> {
    const rows = samples.flatMap(({ band, wordIds }) =>
      wordIds.map((wordId, index) => ({ playerId, band, position: index + 1, wordId })),
    )
    if (rows.length > 0) {
      await this.database.insert(placementWords).values(rows)
    }
  }

  private async insertScores(
    playerId: PlayerId,
    scores: ReadonlyArray<PlacementScore>,
  ): Promise<void> {
    if (scores.length === 0) {
      return
    }
    await this.database
      .insert(placementScores)
      .values(
        scores.map(({ band, score, takenAt }) => ({
          playerId,
          band,
          score,
          takenAt: dateOf(takenAt),
        })),
      )
      .onConflictDoNothing({ target: [placementScores.playerId, placementScores.band] })
  }

  private async wordRowsOf(playerId: PlayerId): Promise<ReadonlyArray<StoredPlacementWord>> {
    return this.database
      .select({ band: placementWords.band, wordId: placementWords.wordId })
      .from(placementWords)
      .where(eq(placementWords.playerId, playerId))
      .orderBy(asc(placementWords.band), asc(placementWords.position))
  }

  private async scoresOf(
    playerId: PlayerId,
  ): Promise<Result<ReadonlyArray<PlacementScore>, DomainError>> {
    const rows = await this.database
      .select({
        band: placementScores.band,
        score: placementScores.score,
        takenAt: placementScores.takenAt,
      })
      .from(placementScores)
      .where(eq(placementScores.playerId, playerId))
      .orderBy(asc(placementScores.band))
    return allOk(rows.map(placementScoreFromRow))
  }
}
