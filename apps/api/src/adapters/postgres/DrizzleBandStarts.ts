import {
  type Band,
  type BandStart,
  type BandStartRepository,
  type DomainError,
  type HoldoutCheck,
  Instant,
  ok,
  type PlayerId,
  type Result,
} from '@mygame/domain'
import { and, asc, eq, sql } from 'drizzle-orm'
import type { PostgresSession } from './connectPostgres'
import { holdoutCheckOf } from './holdoutCheckOf'
import { bandStarts, heldOutWords, holdoutChecks, holdoutCheckWords } from './schema'

type CheckRow = typeof holdoutChecks.$inferSelect

const instantOf = (date: Date): Instant => Instant.fromEpochMilliseconds(date.getTime())

const dateOf = (instant: Instant): Date => new Date(instant.epochMilliseconds)

type CheckChanges = Omit<CheckRow, 'playerId' | 'band' | 'week'>

const checkChangesOf = (check: HoldoutCheck): CheckChanges => {
  switch (check.kind) {
    case 'begun':
      return {
        kind: check.kind,
        begunAt: dateOf(check.begunAt),
        closedAt: null,
        heldOutScore: null,
        practisedScore: null,
      }
    case 'taken':
      return {
        kind: check.kind,
        begunAt: dateOf(check.begunAt),
        closedAt: dateOf(check.takenAt),
        heldOutScore: check.heldOutScore,
        practisedScore: check.practisedScore,
      }
    case 'skipped':
      return {
        kind: check.kind,
        begunAt: null,
        closedAt: dateOf(check.skippedAt),
        heldOutScore: null,
        practisedScore: null,
      }
  }
}

export class DrizzleBandStarts implements BandStartRepository {
  constructor(private readonly database: PostgresSession) {}

  async bandStartsOf(playerId: PlayerId): Promise<Result<ReadonlyArray<BandStart>, DomainError>> {
    const starts = await this.database
      .select({ band: bandStarts.band, startedAt: bandStarts.startedAt })
      .from(bandStarts)
      .where(eq(bandStarts.playerId, playerId))
      .orderBy(asc(bandStarts.band))
    const words = await this.database
      .select({ band: heldOutWords.band, headword: heldOutWords.headword })
      .from(heldOutWords)
      .where(eq(heldOutWords.playerId, playerId))
      .orderBy(sql`${heldOutWords.headword} COLLATE "C"`)
    const checks = await this.database
      .select()
      .from(holdoutChecks)
      .where(eq(holdoutChecks.playerId, playerId))
      .orderBy(asc(holdoutChecks.band), asc(holdoutChecks.week))
    const checkWords = await this.database
      .select({
        band: holdoutCheckWords.band,
        week: holdoutCheckWords.week,
        wordId: holdoutCheckWords.wordId,
        isHeldOut: holdoutCheckWords.isHeldOut,
      })
      .from(holdoutCheckWords)
      .where(eq(holdoutCheckWords.playerId, playerId))
      .orderBy(asc(holdoutCheckWords.position))
    return ok(
      starts.map(({ band, startedAt }) => ({
        band,
        startedAt: instantOf(startedAt),
        heldOutWords: words.filter((word) => word.band === band).map(({ headword }) => headword),
        checks: checks
          .filter((check) => check.band === band)
          .map((row) =>
            holdoutCheckOf(
              row,
              checkWords.filter((word) => word.band === row.band && word.week === row.week),
            ),
          ),
      })),
    )
  }

  async save(playerId: PlayerId, start: BandStart): Promise<Result<void, DomainError>> {
    const inserted = await this.database
      .insert(bandStarts)
      .values({ playerId, band: start.band, startedAt: dateOf(start.startedAt) })
      .onConflictDoNothing({ target: [bandStarts.playerId, bandStarts.band] })
      .returning({ band: bandStarts.band })
    if (inserted.length === 0 || start.heldOutWords.length === 0) {
      return ok(undefined)
    }
    await this.database
      .insert(heldOutWords)
      .values(start.heldOutWords.map((headword) => ({ playerId, band: start.band, headword })))
    return ok(undefined)
  }

  async saveCheck(
    playerId: PlayerId,
    band: Band,
    check: HoldoutCheck,
  ): Promise<Result<void, DomainError>> {
    const changes = checkChangesOf(check)
    await this.database
      .insert(holdoutChecks)
      .values({ playerId, band, week: check.week, ...changes })
      .onConflictDoUpdate({
        target: [holdoutChecks.playerId, holdoutChecks.band, holdoutChecks.week],
        set: changes,
      })
    await this.database
      .delete(holdoutCheckWords)
      .where(
        and(
          eq(holdoutCheckWords.playerId, playerId),
          eq(holdoutCheckWords.band, band),
          eq(holdoutCheckWords.week, check.week),
        ),
      )
    if (check.kind === 'skipped' || check.sample.wordIds.length === 0) {
      return ok(undefined)
    }
    const { wordIds, heldOutWordIds } = check.sample
    await this.database.insert(holdoutCheckWords).values(
      wordIds.map((wordId, index) => ({
        playerId,
        band,
        week: check.week,
        position: index + 1,
        wordId,
        isHeldOut: heldOutWordIds.includes(wordId),
      })),
    )
    return ok(undefined)
  }
}
