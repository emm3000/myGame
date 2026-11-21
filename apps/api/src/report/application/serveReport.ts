import {
  type Clock,
  type DomainError,
  err,
  type Instant,
  ok,
  type PlayerId,
  type Result,
  type TownEvent,
  type TownId,
} from '@mygame/domain'
import {
  type DueReviews,
  type ReviewTerms,
  serveDueReviews,
} from '../../learning/application/serveDueReviews'
import type { TownNewsReader } from '../../town/application/ports/TownNewsReader'
import {
  type CurrentTownDependencies,
  currentTownOf,
} from '../../town/application/resolveCurrentTown'
import type { ReportClosings } from './ports/ReportClosings'

export type ServeReportDependencies = CurrentTownDependencies &
  ReviewTerms & {
    readonly reportClosings: ReportClosings
  }

export type ServedReport = {
  readonly reviews: DueReviews
  readonly news: ReadonlyArray<TownEvent>
}

export type ReportNotServed = DomainError | { readonly kind: 'SignedOut' }

type ReportTown = {
  readonly at: Instant
  readonly townId: TownId | undefined
}

const readReportTown = async (
  playerId: PlayerId,
  dependencies: ServeReportDependencies,
): Promise<Result<ReportTown, DomainError>> => {
  const reading = await currentTownOf(playerId, dependencies)
  if (!reading.ok) {
    return reading.error.kind === 'TownNotFound'
      ? ok({ at: dependencies.clock.now(), townId: undefined })
      : reading
  }
  return ok({ at: reading.value.at, townId: reading.value.town.id })
}

const newsBetween = async (
  closedAt: Instant,
  { at, townId }: ReportTown,
  townNews: TownNewsReader,
): Promise<ReadonlyArray<TownEvent>> => {
  if (townId === undefined) {
    return []
  }
  const news = await townNews.newsAfter(townId, closedAt)
  return news.filter(({ occurredAt }) => occurredAt.epochMilliseconds <= at.epochMilliseconds)
}

const shownAt = (
  playerId: PlayerId,
  closedAt: Instant,
  town: ReportTown,
  dependencies: ServeReportDependencies,
): Promise<Result<ServedReport, DomainError>> => {
  const readClock: Clock = { now: () => town.at }
  return dependencies.inTransaction(async (stores) => {
    await stores.accounts.lockPlayer(playerId)
    const reviews = await serveDueReviews(playerId, stores, readClock, dependencies)
    if (!reviews.ok) {
      return reviews
    }
    const news = await newsBetween(closedAt, town, stores.townNews)
    return ok({ reviews: reviews.value, news })
  })
}

export const serveReport = async (
  playerId: PlayerId,
  dependencies: ServeReportDependencies,
): Promise<Result<ServedReport, ReportNotServed>> => {
  const closedAt = await dependencies.reportClosings.closedAt(playerId)
  if (closedAt === undefined) {
    return err({ kind: 'SignedOut' })
  }
  const town = await readReportTown(playerId, dependencies)
  if (!town.ok) {
    return town
  }
  const shown = await shownAt(playerId, closedAt, town.value, dependencies)
  if (!shown.ok) {
    return shown
  }
  await dependencies.reportClosings.serve(playerId, town.value.at)
  return shown
}
