import {
  type CleanUp,
  type CleanUpRepository,
  type DomainError,
  type Instant,
  ok,
  type Result,
  type SiteAddress,
  type TownId,
} from '@mygame/domain'

const isSameSite = (left: SiteAddress, right: SiteAddress): boolean =>
  left.region === right.region && left.area === right.area && left.site === right.site

export class MemoryCleanUpRepository implements CleanUpRepository {
  private cleanUps: ReadonlyArray<CleanUp> = []

  async lastCleanedAt(site: SiteAddress, at: Instant): Promise<Instant | undefined> {
    return this.cleanUps
      .filter(
        (cleanUp) =>
          isSameSite(cleanUp.site, site) &&
          cleanUp.cleanedAt.epochMilliseconds <= at.epochMilliseconds,
      )
      .reduce<Instant | undefined>(
        (latest, { cleanedAt }) =>
          latest === undefined || cleanedAt.epochMilliseconds > latest.epochMilliseconds
            ? cleanedAt
            : latest,
        undefined,
      )
  }

  async lastCleanedAtIn(
    region: number,
    area: number,
    at: Instant,
  ): Promise<ReadonlyMap<number, Instant>> {
    return new Map(
      this.cleanUps
        .filter(
          ({ site, cleanedAt }) =>
            site.region === region &&
            site.area === area &&
            cleanedAt.epochMilliseconds <= at.epochMilliseconds,
        )
        .sort((left, right) => left.cleanedAt.epochMilliseconds - right.cleanedAt.epochMilliseconds)
        .map(({ site, cleanedAt }) => [site.site, cleanedAt]),
    )
  }

  async record(cleanUp: CleanUp): Promise<Result<void, DomainError>> {
    this.cleanUps = [...this.cleanUps, cleanUp]
    return ok(undefined)
  }

  async cancel(townId: TownId, sentAt: Instant): Promise<Result<void, DomainError>> {
    this.cleanUps = this.cleanUps.filter(
      (cleanUp) =>
        cleanUp.townId !== townId || cleanUp.sentAt.epochMilliseconds !== sentAt.epochMilliseconds,
    )
    return ok(undefined)
  }
}
