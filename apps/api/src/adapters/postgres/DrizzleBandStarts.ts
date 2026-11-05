import {
  type BandStart,
  type BandStartRepository,
  type DomainError,
  Instant,
  ok,
  type PlayerId,
  type Result,
} from '@mygame/domain'
import { asc, eq, sql } from 'drizzle-orm'
import type { PostgresSession } from './connectPostgres'
import { bandStarts, heldOutWords } from './schema'

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
    return ok(
      starts.map(({ band, startedAt }) => ({
        band,
        startedAt: Instant.fromEpochMilliseconds(startedAt.getTime()),
        heldOutWords: words.filter((word) => word.band === band).map(({ headword }) => headword),
      })),
    )
  }

  async save(playerId: PlayerId, start: BandStart): Promise<Result<void, DomainError>> {
    const inserted = await this.database
      .insert(bandStarts)
      .values({
        playerId,
        band: start.band,
        startedAt: new Date(start.startedAt.epochMilliseconds),
      })
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
}
