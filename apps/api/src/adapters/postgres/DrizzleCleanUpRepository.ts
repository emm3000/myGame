import {
  type CleanUp,
  type CleanUpRepository,
  type DomainError,
  Instant,
  ok,
  type Result,
  type SiteAddress,
  type TownId,
} from '@mygame/domain'
import { and, eq, lte, max } from 'drizzle-orm'
import type { PostgresSession } from './connectPostgres'
import { siteCleanUps } from './schema'

export class DrizzleCleanUpRepository implements CleanUpRepository {
  constructor(private readonly database: PostgresSession) {}

  async lastCleanedAt(
    { region, area, site }: SiteAddress,
    at: Instant,
  ): Promise<Instant | undefined> {
    const [latest] = await this.database
      .select({ cleanedAt: max(siteCleanUps.cleanedAt) })
      .from(siteCleanUps)
      .where(
        and(
          eq(siteCleanUps.region, region),
          eq(siteCleanUps.area, area),
          eq(siteCleanUps.site, site),
          lte(siteCleanUps.cleanedAt, new Date(at.epochMilliseconds)),
        ),
      )
    const cleanedAt = latest?.cleanedAt
    return cleanedAt === undefined || cleanedAt === null
      ? undefined
      : Instant.fromEpochMilliseconds(cleanedAt.getTime())
  }

  async lastCleanedAtIn(
    region: number,
    area: number,
    at: Instant,
  ): Promise<ReadonlyMap<number, Instant>> {
    const latest = await this.database
      .select({ site: siteCleanUps.site, cleanedAt: max(siteCleanUps.cleanedAt) })
      .from(siteCleanUps)
      .where(
        and(
          eq(siteCleanUps.region, region),
          eq(siteCleanUps.area, area),
          lte(siteCleanUps.cleanedAt, new Date(at.epochMilliseconds)),
        ),
      )
      .groupBy(siteCleanUps.site)
    return new Map(
      latest.flatMap(({ site, cleanedAt }) =>
        cleanedAt === null ? [] : [[site, Instant.fromEpochMilliseconds(cleanedAt.getTime())]],
      ),
    )
  }

  async record({ townId, sentAt, site, cleanedAt }: CleanUp): Promise<Result<void, DomainError>> {
    await this.database.insert(siteCleanUps).values({
      townId,
      sentAt: new Date(sentAt.epochMilliseconds),
      ...site,
      cleanedAt: new Date(cleanedAt.epochMilliseconds),
    })
    return ok(undefined)
  }

  async cancel(townId: TownId, sentAt: Instant): Promise<Result<void, DomainError>> {
    await this.database
      .delete(siteCleanUps)
      .where(
        and(
          eq(siteCleanUps.townId, townId),
          eq(siteCleanUps.sentAt, new Date(sentAt.epochMilliseconds)),
        ),
      )
    return ok(undefined)
  }
}
