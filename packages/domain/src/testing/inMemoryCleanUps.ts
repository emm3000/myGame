import { ok } from '../Result'
import type { Instant } from '../time/Instant'
import type { CleanUp } from '../town/CleanUp'
import type { CleanUpRepository } from '../town/CleanUpRepository'
import type { SiteAddress } from '../town/SiteAddress'

const isSameSite = (left: SiteAddress, right: SiteAddress): boolean =>
  left.region === right.region && left.area === right.area && left.site === right.site

export const inMemoryCleanUps = (seed: ReadonlyArray<CleanUp> = []): CleanUpRepository => {
  let cleanUps = [...seed]
  return {
    lastCleanedAt: async (site, at) =>
      cleanUps
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
        ),
    record: async (cleanUp) => {
      cleanUps = [...cleanUps, cleanUp]
      return ok(undefined)
    },
    cancel: async (townId, sentAt) => {
      cleanUps = cleanUps.filter(
        (cleanUp) =>
          cleanUp.townId !== townId ||
          cleanUp.sentAt.epochMilliseconds !== sentAt.epochMilliseconds,
      )
      return ok(undefined)
    },
  }
}
